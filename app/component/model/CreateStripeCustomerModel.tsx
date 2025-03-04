import { useAppBridge } from "@shopify/app-bridge-react";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { Form, json, useActionData, useNavigation } from "@remix-run/react";
import { countryOption } from "../../utils/country";
import { useState } from "react";

import {
  FormLayout,
  Checkbox,
  Select,
  Text,
  TextField,
  Collapsible,
  Box,
} from "@shopify/polaris";
// import { createStripeCustomer } from "../../.server/stripeCustomerController.server";



export async function loader() {
  return null;
}

export default function CreateStripeCustomerModel({ model, setModel }) {
  const [billingBox, setBillingBox] = useState(false);
  const  app = useAppBridge();
  const actionData = useActionData();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    address: "",
    currency: "",
    default_source: "",
    description: "",
    email: "",
    invoice_prefix: "",
    invoice_settings: {
      custom_fields: null,
      default_payment_method: null,
      footer: null,
      rendering_options: null,
    },
    livemode: false,
    metadata: {},
    name: "",
    phone: null,
    preferred_locales: [],
    shipping: null,
    tax_exempt: "none",
    test_clock: null,
  });

  const handleRestForm = () => {
    setModel(!model);
  };

  const handleSubmit = () => {};

  return (
    <Modal id="my-modal" open={model} onHide={() => setModel(!model)}>
      <Box padding={"400"}>
        <Form method="POST">
          <FormLayout>
            <TextField label={"Name"} />
            <TextField label={"Account email"} />
            <TextField label={"Description"} />

            <Checkbox
              label="Billing Information"
              checked={billingBox}
              onChange={(value) => setBillingBox(value)}
            />
            <Collapsible
              open={billingBox}
              id="basic-collapsible"
              transition={{
                duration: "500ms",
                timingFunction: "ease-in-out",
              }}
              expandOnPrint
            >
              <TextField type="email" label={"Billing Email"} />
              <Select label="Select your country" options={countryOption} />
              <TextField label={"Account email"} />
              <TextField label={"Description"} />

              <TextField label={"Description"} />
            </Collapsible>
          </FormLayout>
        </Form>
      </Box>
      <TitleBar title="Create Customer">
        <button onClick={handleSubmit} variant="primary">
          Create customer
        </button>
        <button onClick={handleRestForm}>Cancel</button>
      </TitleBar>
    </Modal>
  );
}

export async function action({ request }) {
  const { method } = request;
  switch (method) {
    case "POST":
      const res = await createStripeCustomer();
      return json(res);
    default:
      return json({ message: "Method not Allowed", isError: true });
  }
}