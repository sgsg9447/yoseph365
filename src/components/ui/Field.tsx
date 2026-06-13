import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Common input/textarea visual class string
// 52px tall, rounded-button (12px), focus → 2px primary border via CSS focus pseudo
const inputBase =
  "w-full bg-surface-card text-ink text-[17px] font-[inherit] rounded-button outline-none border border-hairline-strong px-4 focus:border-2 focus:border-primary transition-[border]";

// ── ReqLabel ──────────────────────────────────────────────────────────────────

interface ReqLabelProps {
  children: React.ReactNode;
  optional?: boolean;
}

export function ReqLabel({ children, optional }: ReqLabelProps) {
  return (
    <span className="text-[15px] font-semibold text-body-strong">
      {children}
      {!optional && (
        <span aria-hidden="true" className="text-error ml-1">
          *
        </span>
      )}
    </span>
  );
}

// ── Field (input variant) ─────────────────────────────────────────────────────

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** If true, renders a <textarea> instead of <input> */
  as?: "input";
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  as: "textarea";
}

export function Field(props: FieldProps | TextareaFieldProps) {
  const { label, hint, error, required, as: asEl = "input", ...rest } = props;

  return (
    <label className="flex flex-col gap-[7px]">
      <ReqLabel optional={!required}>{label}</ReqLabel>

      {asEl === "textarea" ? (
        <textarea
          className={[inputBase, "py-[13px] px-4 resize-y leading-[1.6] min-h-[104px]"].join(
            " "
          )}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={[inputBase, "h-[52px]"].join(" ")}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {(error ?? hint) && (
        <span
          className={[
            "text-[13px] leading-[1.5]",
            error ? "text-error" : "text-muted",
          ].join(" ")}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
}
