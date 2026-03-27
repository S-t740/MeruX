"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type LogoVariant = "icon" | "full" | "horizontal" | "stacked";
export type LogoTheme = "light" | "dark" | "auto";

interface MeruxLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

interface MeruxBrandProps extends MeruxLogoProps {
  href?: string;
  showText?: boolean;
  onClick?: () => void;
}

/**
 * Size presets for different logo variants
 */
const LOGO_SIZES = {
  sm: { icon: 24, full: 120, horizontal: 150, stacked: 80 },
  md: { icon: 32, full: 160, horizontal: 200, stacked: 120 },
  lg: { icon: 48, full: 200, horizontal: 300, stacked: 160 },
  xl: { icon: 64, full: 280, horizontal: 400, stacked: 220 },
};

const ASPECT_RATIOS = {
  icon: 1,
  full: 3.33,
  horizontal: 2.77,
  stacked: 0.71,
};

/**
 * Get appropriate logo asset path and dimensions
 */
function getLogoAsset(variant: LogoVariant, theme: "light" | "dark") {
  const isDarkMode = theme === "dark";

  const assets: Record<LogoVariant, string> = {
    icon: isDarkMode ? "/brand/merux-lms-icon-dark.svg" : "/brand/merux-lms-icon.svg",
    full: isDarkMode ? "/brand/merux-lms-logo-full-dark.svg" : "/brand/merux-lms-logo-full.svg",
    horizontal: isDarkMode ? "/brand/merux-lms-logo-horizontal-dark.svg" : "/brand/merux-lms-logo-horizontal.svg",
    stacked: isDarkMode ? "/brand/merux-lms-logo-stacked-dark.svg" : "/brand/merux-lms-logo-stacked.svg",
  };

  return assets[variant];
}

/**
 * MeruxLogo - Standalone logo component
 * Use when you just need the logo without link functionality
 */
export function MeruxLogo({
  variant = "icon",
  theme = "auto",
  size = "md",
  className = "",
  priority = false,
}: MeruxLogoProps) {
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "dark") {
      setResolvedTheme("dark");
      return;
    }

    if (theme === "light") {
      setResolvedTheme("light");
      return;
    }

    const setThemeFromDocument = () => {
      const dataTheme = document.documentElement.getAttribute("data-theme");
      if (dataTheme === "dark" || dataTheme === "light") {
        setResolvedTheme(dataTheme);
        return;
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolvedTheme(prefersDark ? "dark" : "light");
    };

    setThemeFromDocument();

    const observer = new MutationObserver(setThemeFromDocument);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", setThemeFromDocument);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", setThemeFromDocument);
    };
  }, [theme]);

  const src = getLogoAsset(variant, resolvedTheme);
  const logoSize = LOGO_SIZES[size];
  const width = logoSize[variant];
  const height = Math.round(width / ASPECT_RATIOS[variant]);

  return (
    <Image
      src={src}
      alt="Merux LMS"
      width={width}
      height={height}
      className={className}
      priority={priority}
      style={{ width: "auto", height: "auto" }}
    />
  );
}

/**
 * MeruxBrand - Logo with link and optional text
 * Use in navigation bars, headers, footers
 */
export function MeruxBrand({
  variant = "icon",
  theme = "auto",
  size = "md",
  className = "",
  priority = false,
  href = "/",
  showText = true,
  onClick,
}: MeruxBrandProps) {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MeruxLogo variant={variant} theme={theme} size={size} priority={priority} />
      {showText && variant !== "full" && variant !== "horizontal" && (
        <span className="font-outfit font-bold text-lg tracking-tight">
          Merux <span className="bg-clip-text text-transparent bg-gradient-to-r from-hub-indigo to-hub-purple">LMS</span>
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="hover:opacity-80 transition-opacity">
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}

/**
 * MeruxLogoGrid - Display multiple logo variants
 * Useful for brand guidelines pages
 */
export function MeruxLogoGrid() {
  const variants: LogoVariant[] = ["icon", "full", "horizontal", "stacked"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      {variants.map((variant) => (
        <div key={variant} className="space-y-4">
          <h3 className="font-outfit font-bold text-lg capitalize">{variant}</h3>
          <div className="p-6 bg-card border border-border rounded-lg flex items-center justify-center min-h-[150px]">
            <MeruxLogo variant={variant} size="lg" />
          </div>
          <div className="p-6 bg-card border border-border rounded-lg flex items-center justify-center min-h-[150px]" style={{ background: "#0f172a" }}>
            <MeruxLogo variant={variant} theme="dark" size="lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * MeruxHeader - Complete header with logo and tagline
 * Use for hero sections and prominent placements
 */
export function MeruxHeader({ variant = "full", className = "" }: { variant?: LogoVariant; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <MeruxLogo variant={variant} size="lg" priority />
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-outfit font-bold">Learning Intelligence</h1>
        <p className="text-muted-foreground max-w-lg">Connected, adaptive learning powered by Merux LMS by MeruTechHub</p>
      </div>
    </div>
  );
}
