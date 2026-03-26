import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51SX0AdCMqeEsvOyINiFIlg6Py4EqAdqSSYCoBka25ncoL6M7mqXEIN6H6JP142uyTu2mJAzMzNds4P7UAPLJ7MpS00cdD5aimH';
const stripe = Stripe(stripeSecretKey);

export const executePayment = async (req, res) => {
  try {
    const { items } = req.body;

    // Calculate total amount in cents
    const amount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment creation failed" });
  }
};
