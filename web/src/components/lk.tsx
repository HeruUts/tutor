"use client";

import Logo from "@/assets/lk.svg";
import { GitHubLogoIcon, HomeIcon } from "@radix-ui/react-icons";

export default function LK() {
  return (
    <a
      href="https://bright-hikari.id/"
      className="hover:opacity-70 transition-all duration-250"
      target="_blank"
      rel="noopener noreferrer"
    >
      <HomeIcon width="76" />
    </a>
  );
}
