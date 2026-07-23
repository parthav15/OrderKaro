import Image from "next/image"

export function BrandLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-canvas">
      <div className="vm-rise">
        <Image
          src="/wordmark-wine.png"
          alt="Vision Menu"
          width={220}
          height={37}
          priority
          className="block dark:hidden"
        />
        <Image
          src="/wordmark-gold.png"
          alt="Vision Menu"
          width={220}
          height={37}
          priority
          className="hidden dark:block"
        />
      </div>
      <div className="vm-loader-track vm-rise" />
    </div>
  )
}
