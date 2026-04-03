"use client";

import { EventCustomField } from "@/lib/types";

interface CustomFieldsEditorProps {
  fields: EventCustomField[];
  error?: string;
  onAdd: () => void;
  onRemove: (fieldId: string) => void;
  onUpdate: (
    fieldId: string,
    updater: (field: EventCustomField) => EventCustomField,
  ) => void;
}

function inputClass() {
  return "w-full px-4 py-2.5 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors border-border";
}

export function CustomFieldsEditor({
  fields,
  error,
  onAdd,
  onRemove,
  onUpdate,
}: CustomFieldsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Кастомные поля регистрации
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
          Добавить поле
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Дополнительные поля регистрации не добавлены.
        </p>
      )}

      {fields.map((field) => (
        <div
          key={field.id}
          className="border border-border rounded-lg p-3 space-y-3 bg-background/40">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_auto_auto] gap-3 items-center">
            <input
              type="text"
              value={field.label}
              onChange={(e) =>
                onUpdate(field.id, (item) => ({
                  ...item,
                  label: e.target.value,
                }))
              }
              placeholder="Название поля"
              className={inputClass()}
            />
            <select
              value={field.type}
              onChange={(e) =>
                onUpdate(field.id, (item) => ({
                  ...item,
                  type: e.target.value as EventCustomField["type"],
                  options:
                    e.target.value === "select"
                      ? (item.options ?? ["", ""])
                      : [],
                }))
              }
              className={inputClass()}>
              <option value="text">Текст</option>
              <option value="select">Выбор</option>
              <option value="file">Файл</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) =>
                  onUpdate(field.id, (item) => ({
                    ...item,
                    required: e.target.checked,
                  }))
                }
              />
              Обязательное
            </label>
            <button
              type="button"
              onClick={() => onRemove(field.id)}
              className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
              Удалить
            </button>
          </div>

          {field.type === "select" && (
            <textarea
              value={(field.options ?? []).join("\n")}
              onChange={(e) =>
                onUpdate(field.id, (item) => ({
                  ...item,
                  options: e.target.value.split("\n"),
                }))
              }
              rows={3}
              placeholder="Опции выбора (каждая с новой строки)"
              className={`${inputClass()} resize-none`}
            />
          )}
        </div>
      ))}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
