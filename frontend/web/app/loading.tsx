import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-cu-bg-secondary/80 backdrop-blur-[2px]">
            <CoffeeLoader />
        </div>
    );
}
