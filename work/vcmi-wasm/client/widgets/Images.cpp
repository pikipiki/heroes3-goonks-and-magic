/*
 * Images.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "Images.h"

#include "MiscWidgets.h"

#include "../GameEngine.h"
#include "../render/IImage.h"
#include "../render/IRenderHandler.h"
#include "../render/CAnimation.h"
#include "../render/Canvas.h"
#include "../render/ColorFilter.h"
#include "../render/Colors.h"
#include "../../lib/json/JsonNode.h"
#include "../eventsSDL/InputHandler.h"

#include "../battle/BattleInterface.h"

#include "../CPlayerInterface.h"

#include "../../lib/CConfigHandler.h"
#include "../../lib/texts/CGeneralTextHandler.h" //for Unicode related stuff
#include "../../lib/CRandomGenerator.h"

static EImageBlitMode getModeForFlags( uint8_t flags)
{
	if (flags & CCreatureAnim::CREATURE_MODE)
		return EImageBlitMode::WITH_SHADOW_AND_SELECTION;
	if (flags & CCreatureAnim::MAP_OBJECT_MODE)
		return EImageBlitMode::WITH_SHADOW;

	return EImageBlitMode::COLORKEY;
}

CPicture::CPicture(std::shared_ptr<IImage> image, const Point & position)
	: bg(image)
	, needRefresh(false)
{
	pos += position;
	pos.w = bg->width();
	pos.h = bg->height();

	addUsedEvents(LCLICK | SHOW_POPUP);
}

CPicture::CPicture( const ImagePath &bmpname, int x, int y )
	: CPicture(bmpname, Point(x,y))
{}

CPicture::CPicture( const ImagePath & bmpname )
	: CPicture(bmpname, Point(0,0))
{}

CPicture::CPicture( const ImagePath & bmpname, const Point & position, EImageBlitMode mode )
	: bg(ENGINE->renderHandler().loadImage(bmpname, mode))
	, needRefresh(false)
{
	pos.x += position.x;
	pos.y += position.y;

	assert(bg);
	if(bg)
	{
		pos.w = bg->width();
		pos.h = bg->height();
	}
	else
	{
		pos.w = pos.h = 0;
	}

	addUsedEvents(LCLICK | SHOW_POPUP);
}

CPicture::CPicture( const ImagePath & bmpname, const Point & position )
	:CPicture(bmpname, position, EImageBlitMode::COLORKEY)
{}

CPicture::CPicture(const ImagePath & bmpname, const Rect &SrcRect, int x, int y)
	: CPicture(bmpname, Point(x,y))
{
	srcRect = SrcRect;
	pos.w = srcRect->w;
	pos.h = srcRect->h;

	addUsedEvents(LCLICK | SHOW_POPUP);
}

CPicture::CPicture(std::shared_ptr<IImage> image, const Rect &SrcRect, int x, int y)
	: CPicture(image, Point(x,y))
{
	srcRect = SrcRect;
	pos.w = srcRect->w;
	pos.h = srcRect->h;

	addUsedEvents(LCLICK | SHOW_POPUP);
}

void CPicture::show(Canvas & to)
{
	if (needRefresh)
		showAll(to);
}

void CPicture::showAll(Canvas & to)
{
	if(bg)
	{
		if (srcRect.has_value())
			to.draw(bg, pos.topLeft(), *srcRect);
		else
			to.draw(bg, pos.topLeft());
	}
}

void CPicture::setAlpha(uint8_t value)
{
	bg->setAlpha(value);
}

void CPicture::scaleTo(Point size)
{
	bg->scaleTo(size, EScalingAlgorithm::BILINEAR);

	pos.w = bg->width();
	pos.h = bg->height();
}

void CPicture::setPlayerColor(PlayerColor player)
{
	bg->playerColored(player);
}

void CPicture::addLClickCallback(const std::function<void()> & callback)
{
	lCallback = callback;
}

void CPicture::addRClickCallback(const std::function<void()> & callback)
{
	rCallback = callback;
}

void CPicture::clickPressed(const Point & cursorPosition)
{
	if(lCallback)
	{
		ENGINE->input().hapticFeedback();
		lCallback();
	}
}

void CPicture::showPopupWindow(const Point & cursorPosition)
{
	if(rCallback)
		rCallback();
}

CFilledTexture::CFilledTexture(const ImagePath & imageName, Rect position)
	: CIntObject(0, position.topLeft())
	, texture(ENGINE->renderHandler().loadImage(imageName, EImageBlitMode::COLORKEY))
{
	pos.w = position.w;
	pos.h = position.h;
	imageArea = Rect(Point(), texture->dimensions());
}

CFilledTexture::CFilledTexture(const ImagePath & imageName, Rect position, Rect imageArea)
	: CIntObject(0, position.topLeft())
	, texture(ENGINE->renderHandler().loadImage(imageName, EImageBlitMode::COLORKEY))
	, imageArea(imageArea)
{
	pos.w = position.w;
	pos.h = position.h;
}

void CFilledTexture::showAll(Canvas & to)
{
	CanvasClipRectGuard guard(to, pos);

	for (int y=pos.top(); y < pos.bottom(); y+= imageArea.h)
	{
		for (int x=pos.left(); x < pos.right(); x+= imageArea.w)
			to.draw(texture, Point(x,y), imageArea);
	}
}

void FilledTexturePlayerIndexed::setPlayerColor(PlayerColor player)
{
	texture->playerColored(player);
}

FilledTexturePlayerColored::FilledTexturePlayerColored(Rect position)
	:CFilledTexture(ImagePath::builtin("DiBoxBck"), position)
{
}

void FilledTexturePlayerColored::setPlayerColor(PlayerColor player)
{
	ImagePath imagePath = ImagePath::builtin("DialogBoxBackground_" + player.toString() + ".bmp");

	texture = ENGINE->renderHandler().loadImage(imagePath, EImageBlitMode::COLORKEY);
}

CAnimImage::CAnimImage(const AnimationPath & name, size_t Frame, size_t Group, int x, int y, ui8 Flags):
	frame(Frame),
	group(Group),
	flags(Flags)
{
	pos.x += x;
	pos.y += y;
	anim = ENGINE->renderHandler().loadAnimation(name, getModeForFlags(Flags));
	init();
}

CAnimImage::CAnimImage(const AnimationPath & name, size_t Frame, Rect targetPos, size_t Group, ui8 Flags):
	anim(ENGINE->renderHandler().loadAnimation(name, getModeForFlags(Flags))),
	frame(Frame),
	group(Group),
	flags(Flags),
	scaledSize(targetPos.w, targetPos.h)
{
	pos.x += targetPos.x;
	pos.y += targetPos.y;
	init();
}

size_t CAnimImage::size()
{
	return anim->size(group);
}

bool CAnimImage::isScaled() const
{
	return (scaledSize.x != 0);
}

void CAnimImage::setSizeFromImage(const IImage &img)
{
	if (isScaled())
	{
		// At the time of writing this, IImage had no method to scale to different aspect ratio
		// Therefore, have to ignore the target height and preserve original aspect ratio
		pos.w = scaledSize.x;
		pos.h = roundf(float(scaledSize.x) * img.height() / img.width());
	}
	else
	{
		pos.w = img.width();
		pos.h = img.height();
	}
}

void CAnimImage::init()
{
	visible = true;
	auto img = anim->getImage(frame, group);
	if (img)
		setSizeFromImage(*img);
}

CAnimImage::~CAnimImage()
{
}

void CAnimImage::showAll(Canvas & to)
{
	if(!visible)
		return;

	std::vector<size_t> frames = {frame};

	if((flags & CShowableAnim::BASE) && frame != 0)
	{
		frames.insert(frames.begin(), 0);
	}

	for(auto targetFrame : frames)
	{
		if(auto img = anim->getImage(targetFrame, group))
		{
			if(isScaled())
				img->scaleTo(scaledSize, EScalingAlgorithm::BILINEAR);

			to.draw(img, pos.topLeft());
		}
	}
}

void CAnimImage::setAnimationPath(const AnimationPath & name, size_t frame)
{
	this->frame = frame;
	anim = ENGINE->renderHandler().loadAnimation(name, EImageBlitMode::COLORKEY);
	init();
}

void CAnimImage::setScale(Point scale)
{
	scaledSize = scale;
}

void CAnimImage::setFrame(size_t Frame, size_t Group)
{
	if (frame == Frame && group==Group)
		return;
	if (anim->size(Group) > Frame)
	{
		frame = Frame;
		group = Group;
		if(auto img = anim->getImage(frame, group))
		{
			if (player.has_value())
				img->playerColored(*player);
			setSizeFromImage(*img);
		}
	}
	else
		logGlobal->error("Error: accessing unavailable frame %d:%d in CAnimation!", Group, Frame);
}

void CAnimImage::setPlayerColor(PlayerColor currPlayer)
{
	player = currPlayer;
	anim->getImage(frame, group)->playerColored(*player);
	if (flags & CShowableAnim::BASE)
			anim->getImage(0, group)->playerColored(*player);
}

bool CAnimImage::isPlayerColored() const
{
	return player.has_value();
}

CShowableAnim::CShowableAnim(int x, int y, const AnimationPath & name, ui8 Flags, ui32 frameTime, size_t Group, uint8_t alpha):
	anim(ENGINE->renderHandler().loadAnimation(name, getModeForFlags(Flags))),
	group(Group),
	frame(0),
	first(0),
	frameTimeTotal(frameTime),
	frameTimePassed(0),
	flags(Flags),
	xOffset(0),
	yOffset(0),
	alpha(alpha)
{
	last = anim->size(group);

	auto image = anim->getImage(0, group);
	if (image)
	{
		pos.w = image->width();
		pos.h = image->height();
	}
	else
	{
		logGlobal->error("Failed to load group %d of animation file %s", group,  name.getOriginalName());
	}

	pos.x+= x;
	pos.y+= y;

	addUsedEvents(TIME);
}

void CShowableAnim::setAlpha(ui32 alphaValue)
{
	alpha = std::min<ui32>(alphaValue, 255);
}

bool CShowableAnim::set(size_t Group, size_t from, size_t to)
{
	size_t max = anim->size(Group);

	if (to < max)
		max = to;

	if (max < from || max == 0)
		return false;

	group = Group;
	frame = first = from;
	last = max;
	frameTimePassed = 0;
	return true;
}

bool CShowableAnim::set(size_t Group)
{
	if (anim->size(Group)== 0)
		return false;
	if (group != Group)
	{
		first = 0;
		group = Group;
		last = anim->size(Group);
	}
	frame = 0;
	frameTimePassed = 0;
	return true;
}

void CShowableAnim::reset()
{
	frame = first;

	if (callback)
		callback();
}

void CShowableAnim::clipRect(int posX, int posY, int width, int height)
{
	xOffset = posX;
	yOffset = posY;
	pos.w = width;
	pos.h = height;
}

void CShowableAnim::show(Canvas & to)
{
	if ( flags & BASE )// && frame != first) // FIXME: results in graphical glytch in Fortress, upgraded hydra's dwelling
		blitImage(first, group, to);
	blitImage(frame, group, to);
}

void CShowableAnim::tick(uint32_t msPassed)
{
	if ((flags & PLAY_ONCE) && frame + 1 == last)
		return;

	frameTimePassed += msPassed;

	if(frameTimePassed >= frameTimeTotal)
	{
		frameTimePassed -= frameTimeTotal;
		if ( ++frame >= last)
			reset();
	}
}

void CShowableAnim::showAll(Canvas & to)
{
	if ( flags & BASE )// && frame != first)
		blitImage(first, group, to);
	blitImage(frame, group, to);
}

void CShowableAnim::blitImage(size_t frame, size_t group, Canvas & to)
{
	Rect src( xOffset, yOffset, pos.w, pos.h);
	auto img = anim->getImage(frame, group);
	if(img)
	{
		img->setAlpha(alpha);
		if (getModeForFlags(flags) == EImageBlitMode::WITH_SHADOW_AND_SELECTION)
			img->setOverlayColor(Colors::TRANSPARENCY);
		to.draw(img, pos.topLeft(), src);
	}
}

void CShowableAnim::rotate(bool on, bool vertical)
{
	ui8 flag = vertical? VERTICAL_FLIP:HORIZONTAL_FLIP;
	if (on)
		flags |= flag;
	else
		flags &= ~flag;
}

void CShowableAnim::setDuration(int durationMs)
{
	frameTimeTotal = durationMs/(last - first);
}

namespace
{
const JsonNode & mobilePreviewFocusData(const std::shared_ptr<CAnimation> & animation,const AnimationPath * name=nullptr)
{
 static const JsonNode focus(JsonPath::builtin("config/mobile-creature-focus.json"));
 static const JsonNode empty;
 static std::map<std::weak_ptr<CAnimation>,const JsonNode *,std::owner_less<std::weak_ptr<CAnimation>>> entries;
 const std::weak_ptr<CAnimation> key(animation);
 if(name)
 {
  if(entries.size()>128)
   for(auto it=entries.begin();it!=entries.end();)if(it->first.expired())it=entries.erase(it);else ++it;
  const auto & entry=focus[name->getName()];entries[key]=&entry;return entry;
 }
 const auto it=entries.find(key);return it==entries.end()?empty:*it->second;
}
}

CCreatureAnim::CCreatureAnim(int x, int y, const AnimationPath & name, ui8 flags, ECreatureAnimType type):
 CShowableAnim(x,y,name,flags|CREATURE_MODE,100,size_t(type))
{
 xOffset=0;yOffset=0;
 const auto & reference=mobilePreviewFocusData(anim,&name)["reference"];
 if(reference.isVector()&&reference.Vector().size()==4)
 {
  const auto & v=reference.Vector();const Rect bounds(v[0].Integer(),v[1].Integer(),v[2].Integer(),v[3].Integer());
  if(bounds.w>0&&bounds.h>0)mobilePreviewBounds=bounds;
 }
}

void CCreatureAnim::showMobilePreview(Canvas & to,const Rect & target)
{
 const auto image=anim->getImage(frame,group,false);if(!image)return;
 if(!mobilePreviewBounds)mobilePreviewBounds=Rect(Point(),image->dimensions());
 const Rect reference=*mobilePreviewBounds;
 Point center(reference.x+reference.w/2,reference.y+reference.h/2);
 const auto & focus=mobilePreviewFocusData(anim);
 const auto & centers=focus["centers"][std::to_string(group)];
 const auto & origin=focus["origin"];
 if(centers.isVector()&&frame<centers.Vector().size()&&origin.isVector()&&origin.Vector().size()==2)
 {
  const auto & point=centers.Vector()[frame];
  if(point.isVector()&&point.Vector().size()==2)
  {
   center.x+=point.Vector()[0].Integer()-origin.Vector()[0].Integer();
   center.y+=point.Vector()[1].Integer()-origin.Vector()[1].Integer();
  }
 }
 // The zoom comes only from the resting body. Movement, weapons and projectiles
 // can move the camera, but can never make the creature shrink.
 const double scale=std::min(std::max(1.0,target.w*.95)/reference.w,std::max(1.0,target.h*.8)/reference.h);
 const auto dimensions=image->dimensions();
 if(!mobilePreviewCanvas||mobilePreviewCanvas->getRenderArea().w<dimensions.x||mobilePreviewCanvas->getRenderArea().h<dimensions.y)
 {
  mobilePreviewCanvas=std::make_shared<Canvas>(dimensions,CanvasScalingPolicy::IGNORE);mobilePreviewCanvas->applyTransparency(true);
 }
 mobilePreviewCanvas->drawColor(mobilePreviewCanvas->getRenderArea(),Colors::TRANSPARENCY);
 image->setAlpha(alpha);image->setOverlayColor(Colors::TRANSPARENCY);mobilePreviewCanvas->draw(image,Point());
 const double left=center.x-target.w/(2*scale),top=center.y-target.h/(2*scale);
 const int x=std::max(0,int(std::ceil(left))),y=std::max(0,int(std::ceil(top)));
 const int right=std::min(dimensions.x,int(std::floor(left+target.w/scale))),bottom=std::min(dimensions.y,int(std::floor(top+target.h/scale)));
 if(right<=x||bottom<=y)return;
 const Rect crop(x,y,right-x,bottom-y);const Canvas focused(*mobilePreviewCanvas,crop);
 const Point offset(int(std::round((x-left)*scale)),int(std::round((y-top)*scale)));
 const Point size(std::min(target.w-offset.x,std::max(1,int(std::round(crop.w*scale)))),std::min(target.h-offset.y,std::max(1,int(std::round(crop.h*scale)))));
 if(size.x>0&&size.y>0)to.drawScaled(focused,target.topLeft()+offset,size);
}

void CCreatureAnim::loopPreview(bool warMachine)
{
 if(mobilePreviewBounds)
 {
  // Mobile inspection deliberately demonstrates the attack, rather than
  // repeatedly selecting walking/idle poses at random.
  static const ECreatureAnimType sequence[]={ECreatureAnimType::HOLDING,ECreatureAnimType::MOVING,ECreatureAnimType::ATTACK_FRONT,ECreatureAnimType::SHOOT_FRONT,ECreatureAnimType::SPECIAL_FRONT};
  size_t at=0;
  const auto current=ECreatureAnimType(group);
  for(size_t i=0;i<std::size(sequence);++i)if(sequence[i]==current)at=i+1;
  if(current==ECreatureAnimType::MOVE_START || current==ECreatureAnimType::MOVE_END)at=2;
  for(size_t i=0;i<std::size(sequence);++i)
  {
   const auto type=sequence[(at+i) % std::size(sequence)];
   if(anim->size(size_t(type))){addLast(type);return;}
  }
 }

	std::vector<ECreatureAnimType> available;

	static const ECreatureAnimType creaPreviewList[] = {
		ECreatureAnimType::HOLDING,
		ECreatureAnimType::HITTED,
		ECreatureAnimType::DEFENCE,
		ECreatureAnimType::ATTACK_FRONT,
		ECreatureAnimType::SPECIAL_FRONT
	};
	static const ECreatureAnimType machPreviewList[] = {
		ECreatureAnimType::HOLDING,
		ECreatureAnimType::MOVING,
		ECreatureAnimType::SHOOT_UP,
		ECreatureAnimType::SHOOT_FRONT,
		ECreatureAnimType::SHOOT_DOWN
	};

	auto & previewList = warMachine ? machPreviewList : creaPreviewList;

	for (auto & elem : previewList)
		if (anim->size(size_t(elem)))
			available.push_back(elem);

	size_t rnd = CRandomGenerator::getDefault().nextInt((int)available.size() * 2 - 1);

	if (rnd >= available.size())
	{
		ECreatureAnimType type;
		if ( anim->size(size_t(ECreatureAnimType::MOVING)) == 0 )//no moving animation present
			type = ECreatureAnimType::HOLDING;
		else
			type = ECreatureAnimType::MOVING;

		//display this anim for ~1 second (time is random, but it looks good)
		for (size_t i=0; i< 12/anim->size(size_t(type)) + 1; i++)
			addLast(type);
	}
	else
		addLast(available[rnd]);
}

void CCreatureAnim::addLast(ECreatureAnimType newType)
{
	auto currType = ECreatureAnimType(group);

	if (currType != ECreatureAnimType::MOVING && newType == ECreatureAnimType::MOVING)//starting moving - play init sequence
	{
		queue.push( ECreatureAnimType::MOVE_START );
	}
	else if (currType == ECreatureAnimType::MOVING && newType != ECreatureAnimType::MOVING )//previous anim was moving - finish it
	{
		queue.push( ECreatureAnimType::MOVE_END );
	}
	if (newType == ECreatureAnimType::TURN_L || newType == ECreatureAnimType::TURN_R)
		queue.push(newType);

	queue.push(newType);
}

void CCreatureAnim::reset()
{
	//if we are in the middle of rotation - set flag
	if (group == size_t(ECreatureAnimType::TURN_L) && !queue.empty() && queue.front() == ECreatureAnimType::TURN_L)
		rotate(true);
	if (group == size_t(ECreatureAnimType::TURN_R) && !queue.empty() && queue.front() == ECreatureAnimType::TURN_R)
		rotate(false);

	while (!queue.empty())
	{
		ECreatureAnimType at = queue.front();
		queue.pop();
		if (set(size_t(at)))
			return;
	}
	if  (callback)
		callback();
	while (!queue.empty())
	{
		ECreatureAnimType at = queue.front();
		queue.pop();
		if (set(size_t(at)))
			return;
	}
	set(size_t(ECreatureAnimType::HOLDING));
}

void CCreatureAnim::startPreview(bool warMachine)
{
	callback = std::bind(&CCreatureAnim::loopPreview, this, warMachine);
}

void CCreatureAnim::clearAndSet(ECreatureAnimType type)
{
	while (!queue.empty())
		queue.pop();
	set(size_t(type));
}
