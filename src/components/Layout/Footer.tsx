// import { User } from "@/src/types";
import { User } from "@/src/api";
import { BRAND } from "@/src/config/brand";
import React from "react";

interface FooterProps {
  currentUser: User;
}

export const Footer: React.FC<FooterProps> = ({ currentUser }) => {
  return (
    <footer className="border-t border-slate-200/60 bg-white py-3 text-center text-[11px] text-slate-400 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <span>{BRAND.legalName} • {BRAND.tagline}</span>
        <span>
          Signed in as{" "}
          <strong className="text-slate-600">{currentUser.fullName}</strong> (
          {currentUser.role})
        </span>
      </div>
    </footer>
  );
};
