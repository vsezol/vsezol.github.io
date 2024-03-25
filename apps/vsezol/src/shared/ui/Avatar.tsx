/* eslint-disable @next/next/no-img-element */
export interface AvatarProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export const Avatar = ({ src, alt, priority = false }: AvatarProps) => {
  return (
    <div className="avatar">
      <div className="w-24 h-24 rounded-full">
        <figure>
          <img src={src} alt={alt} width={96} height={96} />
        </figure>
      </div>
    </div>
  );
};
