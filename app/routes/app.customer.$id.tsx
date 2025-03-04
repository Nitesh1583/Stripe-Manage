import { json, useLoaderData } from "@remix-run/react";
import { Box, Card, Layout, Page, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";


export async function loader({ request, params }) {
  const auth=await authenticate.admin(request);
  return json({ params });
}

export default function SingleProductPage() {
  const { params } = useLoaderData();
  console.log(params.id);
  return (
    <Page>
      <Layout>
        <Box>
          <Card>
            <Text>{params}</Text>
          </Card>
        </Box>
      </Layout>
    </Page>
  );
}


export async function action({ request }) {
  return null;
}
