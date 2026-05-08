// src/components/pos/product-card.tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function ProductCard({ product, onAddToCart }) {
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={() => onAddToCart(product)}
    >
      <CardContent className="p-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full object-cover rounded-t-lg"
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start p-3">
        <p className="font-semibold text-sm truncate w-full">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          LKR {product.price.toFixed(2)}
        </p>
      </CardFooter>
    </Card>
  );
}
