import { createContext, useContext, useEffect, useId, useRef } from "react";
import * as LR from "@uploadcare/blocks";
import fileUploaderRegularCssSrc from "@uploadcare/blocks/web/lr-file-uploader-regular.min.css?url";
import { OutputFileEntry } from "@uploadcare/blocks";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { FileImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/features/auth/useAuth";

type RefType = typeof LR.UploadCtxProvider.prototype & LR.UploadCtxProvider;

type ContextProps = {
  uploaderRef: React.MutableRefObject<RefType> | null;
  files: OutputFileEntry[];
  onChange: (files: OutputFileEntry[]) => void;
};

const UploaderContext = createContext<ContextProps>({
  uploaderRef: null,
  files: [],
  onChange: () => undefined,
});

type Props = {
  ctxName?: string;
  files: OutputFileEntry[];
  onChange: (files: OutputFileEntry[]) => void;
  children: React.ReactNode;
  className?: string;
} & Partial<ConfigPlainType>;

export const FileUploader: React.FC<Props> = ({
  ctxName,
  files,
  onChange,
  children,
  className,
  ...rest
}) => {
  const { ucareToken } = useAuth();
  const id = useId();
  ctxName ??= id;

  const uploaderRef = useRef<RefType>(null);

  useEffect(() => {
    const ctx = uploaderRef.current;
    if (!ctx) return;

    const handleUploadEvent = (e: CustomEvent<OutputFileEntry[]>) => {
      if (e.detail && e.detail.length > 0) onChange([...e.detail]);
    };

    const handleDoneFlow = () => {
      ctx.uploadCollection.clearAll();
    };

    ctx.addEventListener("data-output", handleUploadEvent);
    ctx.addEventListener("done-flow", handleDoneFlow);

    return () => {
      ctx.removeEventListener("data-output", handleUploadEvent);
      ctx.removeEventListener("done-flow", handleDoneFlow);
    };
  }, [onChange]);

  return (
    <UploaderContext.Provider value={{ uploaderRef, files, onChange }}>
      <div className={className}>{children}</div>
      <div className="absolute">
        <lr-config
          {...rest}
          ctx-name={ctxName}
          pubkey={import.meta.env.VITE_UPLOAD_CARE_PUBLIC_TOKEN}
          secureSignature={ucareToken?.signature}
          secureExpire={ucareToken?.expire.toString()}
          maxLocalFileSizeBytes={5000000}
          imgOnly={true}
          sourceList="local, url"
          use-cloud-image-editor="true"
        ></lr-config>
        <lr-headless-modal
          ctx-name={ctxName}
          css-src={fileUploaderRegularCssSrc}
          class="uploadcare-config"
        ></lr-headless-modal>
        <lr-upload-ctx-provider
          ctx-name={ctxName}
          ref={uploaderRef}
        ></lr-upload-ctx-provider>
        <lr-data-output ctx-name={ctxName} use-event></lr-data-output>
      </div>
    </UploaderContext.Provider>
  );
};

type TriggerProps = {
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const UploadTrigger: React.FC<TriggerProps> = ({ asChild, ...rest }) => {
  const { uploaderRef } = useContext(UploaderContext);
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      type="button"
      variant="secondary"
      onClick={() => uploaderRef?.current?.initFlow()}
      {...rest}
    />
  );
};

type PreviewProps = React.HTMLAttributes<HTMLDivElement>;

export const UploaderPreview: React.FC<PreviewProps> = ({
  className,
  ...rest
}) => {
  const { files, onChange } = useContext(UploaderContext);

  if (files.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-4", className)} {...rest}>
      {files.map((file) => (
        <div
          key={file.cdnUrl ?? `${file.name}${file.size}`}
          className="relative"
        >
          {file.cdnUrl ? (
            <>
              <img
                className="rounded-md"
                src={`${file.cdnUrl}-/scale_crop/100x100/center/-/progressive/yes/`}
                width={100}
                height={100}
                alt={file.originalFilename ?? ""}
                title={file.originalFilename ?? ""}
              />
              <button
                className="absolute right-0 top-0 rounded-md bg-accent p-1 opacity-70 transition-all hover:bg-destructive hover:opacity-100"
                onClick={() =>
                  onChange(files.filter((f) => f.cdnUrl !== file.cdnUrl))
                }
              >
                <Cross1Icon />
              </button>
            </>
          ) : (
            <div className="grid h-[100px] w-[100px] place-content-center rounded-md bg-secondary text-card-foreground">
              <FileImageIcon />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
