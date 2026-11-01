#include "../../work/vcmi-wasm/lib/era/EraTransformerPreview.h"
#include <cassert>
int main()
{
 using namespace era_bridge;
 const int source=2,target=295;bool left=true,pending=false;
 assert(transformerPreviewCreature(source,left,target)==source);
 left=false;assert(transformerPreviewCreature(source,left,target)==target);
 pending=true;assert(confirmTransformerReturn(left,pending));assert(left&&!pending);
 assert(transformerPreviewCreature(target,left,56)==target); // confirmed archer remains295, not next conversion56.
 assert(!confirmTransformerReturn(left,pending)); // no second motion on subsequent garrison update.
 left=false;assert(transformerPreviewCreature(source,left,-1)==source); // unmapped roster retains native display.
 left=true;pending=true;assert(!confirmTransformerReturn(left,pending));assert(!pending);
}
