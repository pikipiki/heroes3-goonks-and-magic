#pragma once

// Coordinates before the portrait board's counter-clockwise projection.
// Preserve the original screen-space offset from the target, just as upright
// creature sprites do, instead of rotating that offset around the target.
namespace mobile_effects
{
struct Origin { int x; int y; };
constexpr Origin anchoredOrigin(int imageX, int imageY, int imageHeight, int anchorX, int anchorY)
{
 return {anchorX + anchorY - imageY - imageHeight, anchorY + imageX - anchorX};
}
}
