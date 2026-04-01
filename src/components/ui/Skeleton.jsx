// src/components/ui/Skeleton.jsx
export default function Skeleton({ className = '', style = {}, height, width, borderRadius }) {
  const inlineStyle = {
    ...style,
    ...(height && { height }),
    ...(width && { width }),
    ...(borderRadius && { borderRadius }),
  }
  
  return (
    <div className={`skeleton-loader ${className}`} style={inlineStyle} />
  )
}
