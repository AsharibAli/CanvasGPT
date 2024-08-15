import React from "react";
import CanvasGPT from "./CanvasGPT";
import { Metadata } from "next";

export const metadata: Metadata = {
  other: {
    "dscvr:canvas:version": "vNext",
    "og:image": "/next.svg",
  },
};

const page = () => {
  return (
    <div>
      <CanvasGPT />
    </div>
  );
};

export default page;
