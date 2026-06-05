// Studio routes use a bare layout — no dashboard sidebar
// The session room and lobby manage their own chrome
export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
