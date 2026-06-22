"use client";

import { useEffect, useState } from "react";
import { Toaster } from "./sonner";

type ToasterProps = React.ComponentProps<typeof Toaster>;

export default function ClientToaster(props: ToasterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Toaster {...props} />;
}
