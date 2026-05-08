"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useSearchParams } from "next/navigation";
import RecipeForm from "@/components/production/recipe-form";
import { Loader2 } from "lucide-react";

export default function EditRecipePage() {
  const { id } = useSearchParams();
  const { data: session } = useSession();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!session?.accessToken || !id) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setRecipe(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch recipe", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, session]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Initializing builder context...</div>;

  return <RecipeForm initialData={recipe} />;
}
