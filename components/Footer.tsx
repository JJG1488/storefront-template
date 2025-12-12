import { getStoreConfig } from "@/lib/store";

export function Footer() {
  const store = getStoreConfig();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">{store.name}</h3>
          <p className="text-gray-400">&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
