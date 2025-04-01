import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from 'react';

// Loader function
export async function loader({ request }) {

    return "Success";

}