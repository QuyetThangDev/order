import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Resizable } from 're-resizable'
import { useState, CSSProperties } from 'react'
import { ITable } from '@/types'
import { TableStatus } from '@/constants'

// Định nghĩa interface cho delta resize
interface ResizeData {
  width: number
  height: number
}

interface TableItemProps {
  table: ITable
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  onContextMenu: (e: React.MouseEvent) => void
  onResize?: (size: { width: number; height: number }) => void
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  containerBounds?: DOMRect
}

export function TableItem({
  table,
  position,
  size = { width: 80, height: 80 },
  onContextMenu,
  onResize,
  isSelected,
  onClick,
  containerBounds,
}: TableItemProps) {
  const [isResizing, setIsResizing] = useState(false)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: table.slug,
    disabled: isResizing,
  })
  const [localSize, setLocalSize] = useState(size)

  const xPos = position?.x ?? table.xPosition ?? 0
  const yPos = position?.y ?? table.yPosition ?? 0

  const constrainPosition = (x: number, y: number) => {
    if (!containerBounds) return { x, y }

    const maxX = containerBounds.width - localSize.width / 2
    const maxY = containerBounds.height - localSize.height / 2
    const minX = localSize.width / 2
    const minY = localSize.height / 2

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    }
  }

  const constrainedPosition = constrainPosition(xPos, yPos)

  const style: CSSProperties = {
    ...(transform ? { transform: CSS.Translate.toString(transform) } : {}),
    width: 'fit-content',
    left: `${constrainedPosition.x - localSize.width / 2}px`,
    top: `${constrainedPosition.y - localSize.height / 2}px`,
    transitionProperty: 'left, top',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-out',
    ...(transform ? { transition: 'none' } : {}),
    touchAction: 'none',
    position: 'absolute',
  }

  const getStatusColor = () => {
    switch (table.status) {
      case TableStatus.AVAILABLE:
        return 'bg-muted-foreground/10'
      case TableStatus.RESERVED:
        return 'bg-yellow-500'
      default:
        return 'border-gray-500'
    }
  }

  return (
    <div
      className="mt-14"
      ref={setNodeRef}
      {...(isResizing ? {} : listeners)}
      {...(isResizing ? {} : attributes)}
      style={style}
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      <div
        className={`rounded-md bg-transparent p-2 transition-all duration-200 ${isSelected
          ? 'z-10 scale-110 border-primary bg-primary/10 ring-2 ring-green-500'
          : 'bg-background hover:scale-105 hover:ring-2 hover:ring-primary/50'
          } `}
      >
        <div className="flex items-center gap-2">
          {/* <div className={`w-2 h-3/5 rounded-full ${getStatusColor()}`} /> */}
          <div className="flex flex-col items-center gap-2">
            <div className={`h-2 w-2/3 rounded-full ${getStatusColor()}`} />
            <Resizable
              size={localSize}
              onResizeStart={() => setIsResizing(true)}
              onResizeStop={(_e, _direction, _ref, d: ResizeData) => {
                setIsResizing(false)
                const newSize = {
                  width: localSize.width + d.width,
                  height: localSize.height + d.height,
                }
                setLocalSize(newSize)
                onResize?.(newSize)
              }}
              minWidth={100}
              minHeight={30}
              maxWidth={containerBounds?.width || 200} // Giới hạn tối đa theo container
              maxHeight={containerBounds?.height || 200}
              handleStyles={{
                bottomRight: {
                  bottom: 0,
                  right: 0,
                  cursor: 'se-resize',
                  width: '20px',
                  height: '10px',
                },
              }}
            >
              <div
                className={`flex cursor-pointer items-center justify-center rounded-md ${getStatusColor()}`}
                style={{ width: '100%', height: '100%' }}
              >
                <span className="flex items-center justify-center p-1 text-sm font-medium bg-white rounded-full h-7 w-7 text-muted-foreground">
                  {table.name}
                </span>
              </div>
            </Resizable>
            <div className={`h-2 w-2/3 rounded-full ${getStatusColor()}`} />
          </div>
          {/* <div className={`w-2 h-3/5 rounded-full ${getStatusColor()}`} /> */}
        </div>
      </div>
    </div>
  )
}
