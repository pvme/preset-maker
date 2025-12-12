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
  img: ["src", "alt", "class", "data-emoji"],
};

const DE_EMOJIFY_REGEX = /<img[^>]*data-emoji="([^"]+)"[^>]*>/g;

export function useEmojiEditableField({
  value,
  allowMultiline = true,
  onCommit,
}: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  const [html, setHtml] = useState(() => emojify(value ?? ""));

  // Sync from external value ONLY when not editing
  useEffect(() => {
    if (isFocused.current) return;
    setHtml(emojify(value ?? ""));
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

  const onFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  const onChange = useCallback(() => {
    // Intentionally empty — browser owns DOM while focused
  }, []);

  const onBlur = useCallback(() => {
    if (!ref.current) return;
    isFocused.current = false;

    const htmlValue = ref.current.innerHTML ?? "";
    const textValue = htmlValue.replace(DE_EMOJIFY_REGEX, "$1");
    const clean = sanitise(textValue).trim();

    setHtml(emojify(clean));
    onCommit(clean);
  }, [onCommit]);

  return {
    ref,
    html,
    onFocus,
    onChange,
    onBlur,
  };
}
