"use client";

import { toast } from "@/hooks/use-toast";

export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
  });
}

export function showErrorToast(description: string, title = "Ошибка") {
  toast({
    title,
    description,
    variant: "destructive",
  });
}
