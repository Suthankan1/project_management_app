import FullLayout from '@/components/layout/FullLayout';

export default function DocumentationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FullLayout>
            {/* overflow-x-hidden prevents horizontal scroll from any wide content (tables, code blocks) while keeping vertical scroll intact */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                {children}
            </main>
        </FullLayout>
    );
}
