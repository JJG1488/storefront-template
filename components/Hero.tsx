import { getStoreConfig } from "@/lib/store";

export function Hero() {
  const store = getStoreConfig();

  return (
    <section
      className="py-20 px-4 text-center"
      style={{ backgroundColor: `${store.primaryColor}10` }}
    >
      <div className="max-w-4xl mx-auto">
        {store.logoUrl && (
          <img
            src={store.logoUrl}
            alt={store.name}
            className="h-20 mx-auto mb-6"
          />
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{store.name}</h1>
        <p className="text-xl text-gray-600 mb-8">
          Welcome to our store. Browse our collection below.
        </p>
        <a
          href="#products"
          className="inline-block px-8 py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Shop Now
        </a>
      </div>
    </section>
  );
}
