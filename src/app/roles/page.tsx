"use client"
import { redirect } from "next/navigation";

export default function RolesRedirect() {
    redirect("/dashboard/super_admin");
}
