import { useEffect, useRef } from "react";
import * as LR from "@uploadcare/blocks";
import fileUploaderRegularCssSrc from "@uploadcare/blocks/web/lr-file-uploader-regular.min.css?url";
import { OutputFileEntry } from "@uploadcare/blocks";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { FileImageIcon } from "lucide-react";

type Props = {
  ctxName: string;
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
  const uploaderRef = useRef<
    typeof LR.UploadCtxProvider.prototype & LR.UploadCtxProvider
  >(null);

  useEffect(() => {
    const ctx = uploaderRef.current;
    if (!ctx) return;

    const handleUploadEvent = (e: CustomEvent<OutputFileEntry[]>) => {
      if (e.detail) onChange([...e.detail]);
    };

    const handleDoneFlow = () => {
      ctx.uploadCollection.__items = new Set();
    };

    ctx.addEventListener("data-output", handleUploadEvent);
    ctx.addEventListener("done-flow", handleDoneFlow);

    return () => {
      ctx.removeEventListener("data-output", handleUploadEvent);
      ctx.removeEventListener("done-flow", handleDoneFlow);
    };
  }, [onChange]);

  return (
    <div className={className}>
      <Slot
        onClick={() => uploaderRef.current?.initFlow()}
        children={children}
      />

      <div
        className={cn("flex flex-wrap gap-4", files.length === 0 && "hidden")}
      >
        {files.map((file) => (
          <div
            key={file.uuid ?? `${file.name}${file.size}`}
            className="relative"
          >
            {file.uuid ? (
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
                    onChange(files.filter((f) => f.uuid !== file.uuid))
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

      <div className="absolute">
        <lr-config
          {...rest}
          ctx-name={ctxName}
          pubkey={import.meta.env.VITE_UPLOAD_CARE_PUBLIC_TOKEN}
          // secureSignature={ucareToken}
          // secureExpire={expire?.toString()}
          maxLocalFileSizeBytes={5000000}
          imgOnly={true}
          sourceList="local, url, camera"
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
    </div>
  );
};
