import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowBigLeft, ArrowBigRight, X } from "lucide-react";
import { ProductImage } from "../productsApiSlice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  images: ProductImage[];
};

export const ProductImages: React.FC<Props> = ({
  images,
  className,
  ...rest
}) => {
  const [index, setIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const nextImage = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const previousImage = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const onArrowsClick = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "ArrowRight") nextImage();
    else if (e.code === "ArrowLeft") previousImage();
  };

  const buttons = (
    <>
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 z-[1] bg-background/50"
        onClick={previousImage}
      >
        <ArrowBigLeft />
        <span className="sr-only">Previous image</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 z-[1] bg-background/50"
        onClick={nextImage}
      >
        <ArrowBigRight />
        <span className="sr-only">Next image</span>
      </Button>
    </>
  );

  return (
    <>
      <Dialog.Root open={isFullScreen} onOpenChange={setIsFullScreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            onKeyUp={onArrowsClick}
            className="fixed inset-0 z-50 grid w-full place-content-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
            <div className="p-2 sm:p-4">
              {buttons}
              <div className="flex items-center overflow-hidden">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="h-full w-full shrink-0 grow-0 px-px transition-transform"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                  >
                    <img
                      src={`${img.imageUrl}-/progressive/yes/`}
                      loading="lazy"
                      alt={`image ${index + 1}`}
                      className="mx-auto max-h-[calc(100vh-4rem)] object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="size-6 text-background dark:text-foreground" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div
        {...rest}
        className={cn("flex flex-col justify-center gap-1", className)}
        onKeyUp={onArrowsClick}
      >
        <div className="relative gap-4">
          {buttons}
          <button
            onClick={() => setIsFullScreen(true)}
            className="flex w-full items-center overflow-hidden"
          >
            {images.map((img) => (
              <div
                key={img.id}
                className="w-full shrink-0 grow-0 px-px transition-transform"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                <img
                  src={`${img.imageUrl}-/preview/${Math.min(600, img.width)}x${Math.min(600, img.height)}/-/progressive/yes/`}
                  loading="lazy"
                  alt={`image ${index + 1}`}
                  height={Math.min(500, img.height)}
                  className="mx-auto max-h-[500px]"
                />
              </div>
            ))}
          </button>
        </div>
        <div className="scrollbar mx-auto grid max-w-full snap-x snap-mandatory scroll-p-1 auto-cols-[50px] grid-flow-col gap-1 overflow-x-scroll overscroll-x-contain p-1">
          {images.map((img, i) => (
            <button key={img.id} onClick={() => setIndex(i)}>
              <img
                src={`${img.imageUrl}-/preview/50x50/-/progressive/yes/`}
                loading="lazy"
                alt={`image ${index + 1} preview`}
                className={cn(
                  "h-[50px] w-[50px] cursor-pointer snap-start object-contain ring-primary",
                  i === index && "ring",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
