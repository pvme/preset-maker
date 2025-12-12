import { useCallback, useEffect, useRef, useState } from "react";
import sanitizeHtml from "sanitize-html";
import { emojify } from "../utility/emojify";

interface Options {
  value: string;
  allowMultiline?: boolean;
  onCommit: (raw: string) => void;
}

const allowedTags = ["img", "br", "div", "span"];
const allowedAttributes = {
  img: ["src", "alt", "class"],
};

export function useEmojiEditableField({
  value,
  allowMultiline = true,
  onCommit,
}: Options) {
  const ref = useRef<HTMLDivElement>(null);

  const [raw, setRaw] = useState(value);
  const [html, setHtml] = useState(emojify(value));

  // Sync from Redux when value genuinely changes
  useEffect(() => {
    setRaw(value);
    setHtml(emojify(value));
  }, [value]);

  const sanitise = (input: string) => {
    if (!allowMultiline) {
      input = input
        .replace(/<div>/g, "")
        .replace(/<\/div>/g, "")
        .replace(/<br\s*\/?>/g, " ");
    }

    return sanitizeHtml(input, {
      allowedTags,
      allowedAttributes,
    });
  };

  // Live typing: browser updates DOM, we mirror it
  const onChange = useCallback((e: any) => {
    const nextHtml = e.currentTarget.innerHTML;
    const cleaned = sanitise(nextHtml);
    const rendered = emojify(cleaned);

    setHtml(rendered);
    setRaw(e.currentTarget.innerText ?? "");
  }, []);

  // Commit on blur only
  const onBlur = useCallback(() => {
    onCommit(raw);
  }, [raw, onCommit]);

  return {
    ref,
    html,
    raw,
    onChange,
    onBlur,
  };
}
