import { triggerAsyncId } from 'async_hooks';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from "next-auth/react";
import { stripe } from '../../services/stripe';
import { fauna } from '../../services/fauna';
import { query as q} from 'faunadb';

type User = {
    ref: {
        id: string
    },
    data: {
        stripe_customer_id: string;
    }
}

const subscribe = async function(req:NextApiRequest, res:NextApiResponse){

    if(req.method === 'POST'){
        const session = await getSession({ req });

        const user = await fauna.query<User>(
            q.Get(
                q.Match(
                    q.Index('user_by_email'),
                    q.Casefold(session.user.email)
                )
            )
        )

        let stripe_customer_id = user.data.stripe_customer_id;

        if(!stripe_customer_id){
            const stripeCustomer = await stripe.customers.create({
                email: session.user.email,
            })

            await fauna.query(
                q.Update(
                    q.Ref(q.Collection('users'), user.ref.id),
                    {
                        data: {
                            stripe_customer_id: stripeCustomer.id
                        }
                    }
                )
            )

            stripe_customer_id = stripeCustomer.id;
        }


        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: stripe_customer_id,
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            line_items: [
                {price: 'price_1LuP3mAHv2bY6jKsWM1w2H0u', quantity: 1}
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: process.env.STRIPE_SUCCESS_URL,
            cancel_url: process.env.STRIPE_CANCEL_URL,
        })

        return res.status(200).json({sessionId: stripeCheckoutSession.id});
    } else {
        res.setHeader('allow', 'POST');
        res.status(405).end('Method not allowed');
    }
}

export default subscribe;