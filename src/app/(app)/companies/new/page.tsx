import type { Metadata } from "next";
import Link from "next/link";
import { CompanyForm } from "../company-form";

export const metadata: Metadata = { title: "Add a company" };

export default function NewCompanyPage() {
  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex flex-col gap-3">
        <Link href="/companies" className="btn-ghost self-start">
          ← Companies
        </Link>
        <h1 className="text-heading-lg">Add a company</h1>
        <p className="text-prose text-ink-muted">
          Something you own, or something you&apos;re keeping an eye on.
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
