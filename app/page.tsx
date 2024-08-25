import React from "react";
import { Metadata } from "next";
import UnlockCanvas from "@/components/UnlockCanvas";

export const metadata: Metadata = {
  other: {
    "dscvr:canvas:version": "vNext",
    "og:image": "/next.svg",
  },
};

const page = () => {
  return (
    <div>
      <UnlockCanvas />
    </div>
  );
};

export default page;
