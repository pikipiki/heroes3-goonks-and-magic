/*
 * BattleProjectileController.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "BattleProjectileController.h"

#include "BattleInterface.h"
#include "BattleSiegeController.h"
#include "BattleFieldController.h"
#include "BattleStacksController.h"
#include "CreatureAnimation.h"

#include "../render/CAnimation.h"
#include "../render/Canvas.h"
#include "../render/IRenderHandler.h"
#include "../GameEngine.h"

#include "../../lib/CStack.h"
#include "../../lib/mapObjects/CGTownInstance.h"

static double calculateCatapultParabolaY(const Point & from, const Point & dest, int x)
{
	double facA = 0.005; // seems to be constant

	// system of 2 linear equations, solutions of which are missing coefficients
	// for quadratic equation a*x*x + b*x + c
	double eq[2][3] = {
		{ static_cast<double>(from.x), 1.0, from.y - facA*from.x*from.x },
		{ static_cast<double>(dest.x), 1.0, dest.y - facA*dest.x*dest.x }
	};

	// solve system via determinants
	double det  = eq[0][0] *eq[1][1] - eq[1][0] *eq[0][1];
	double detB = eq[0][2] *eq[1][1] - eq[1][2] *eq[0][1];
	double detC = eq[0][0] *eq[1][2] - eq[1][0] *eq[0][2];

	double facB = detB / det;
	double facC = detC / det;

	return facA *pow(x, 2.0) + facB *x + facC;
}

void ProjectileMissile::show(Canvas & canvas)
{
 const auto upright=[](const Point & p,const Point & anchor){return Point(anchor.x+anchor.y-p.y,anchor.y+p.x-anchor.x);};
 const bool vertical=canvas.hasMobileUprightImages()&&mobileAnchored;
 const Point start=vertical?upright(from,mobileFromAnchor):from,end=vertical?upright(dest,mobileDestAnchor):dest;
	size_t group = reverse ? 1 : 0;
	auto image = animation->getImage(frameNum, group, true);

	if(image)
	{
		Point pos {
			vstd::lerp(start.x, end.x, progress) - image->width() / 2,
			vstd::lerp(start.y, end.y, progress) - image->height() / 2,
		};

		canvas.draw(image, pos);
	}
}

void ProjectileMissile::tick(uint32_t msPassed)
{
	float timePassed = msPassed / 1000.f;
	progress += timePassed * speed;
}

void ProjectileAnimatedMissile::tick(uint32_t msPassed)
{
	ProjectileMissile::tick(msPassed);
	frameProgress += AnimationControls::getSpellEffectSpeed() * msPassed / 1000;
	size_t animationSize = animation->size(reverse ? 1 : 0);
	while (frameProgress > animationSize)
		frameProgress -= animationSize;

	frameNum = std::floor(frameProgress);
}

void ProjectileCatapult::tick(uint32_t msPassed)
{
	frameProgress += AnimationControls::getSpellEffectSpeed() * msPassed / 1000;
	float timePassed = msPassed / 1000.f;
	progress += timePassed * speed;
}

void ProjectileCatapult::show(Canvas & canvas)
{
	int frameCounter = std::floor(frameProgress);
	int frameIndex = (frameCounter + 1) % animation->size(0);

	auto image = animation->getImage(frameIndex, 0, true);

	if(image)
	{
		int posX = vstd::lerp(from.x, dest.x, progress);
		int posY = calculateCatapultParabolaY(from, dest, posX);
		Point pos(posX, posY);

		canvas.draw(image, pos);
	}
}

void ProjectileRay::show(Canvas & canvas)
{
	const auto upright=[](const Point & p,const Point & anchor){return Point(anchor.x+anchor.y-p.y,anchor.y+p.x-anchor.x);};
 const Point start=canvas.hasMobileUprightImages()&&mobileAnchored?upright(from,mobileFromAnchor):from;
 const Point end=canvas.hasMobileUprightImages()&&mobileAnchored?upright(dest,mobileDestAnchor):dest;
 // Hold the full beam for the final quarter, so a frame reaches the impact point.
 const float extent=std::clamp(progress/0.75f,0.0f,1.0f);
 const size_t strokeCount=canvas.hasMobileUprightImages()?std::max<size_t>(3,rayConfig.size()):rayConfig.size();
 Point curr {
		vstd::lerp(start.x, end.x, extent),
		vstd::lerp(start.y, end.y, extent),
	};

	Point length = curr - start;

	//select axis to draw ray on, we want angle to be less than 45 degrees so individual sub-rays won't overlap each other

	if (std::abs(length.x) > std::abs(length.y)) // draw in horizontal axis
	{
		int y1 =  start.y - strokeCount / 2;
		int y2 =  curr.y - strokeCount / 2;

		int x1 = start.x;
		int x2 = curr.x;

		for (size_t i = 0; i < strokeCount; ++i)
		{
			auto ray = rayConfig[std::min(i,rayConfig.size()-1)];
			canvas.drawLine(Point(x1, y1 + i), Point(x2, y2+i), ray.start, ray.end);
		}
	}
	else // draw in vertical axis
	{
		int x1 = start.x - strokeCount / 2;
		int x2 = curr.x - strokeCount / 2;

		int y1 = start.y;
		int y2 = curr.y;

		for (size_t i = 0; i < strokeCount; ++i)
		{
			auto ray = rayConfig[std::min(i,rayConfig.size()-1)];

			canvas.drawLine(Point(x1 + i, y1), Point(x2 + i, y2), ray.start, ray.end);
		}
	}
}

void ProjectileRay::tick(uint32_t msPassed)
{
	float timePassed = msPassed / 1000.f;
	progress += timePassed * speed;
}

void ProjectileStarcraft::tick(uint32_t msPassed)
{
 const float seconds=msPassed/1000.f;elapsed+=seconds;progress+=seconds*speed;
}

void ProjectileStarcraft::show(Canvas & canvas)
{
 const bool vertical=canvas.hasMobileUprightImages()&&mobileAnchored;
 const auto upright=[](const Point & p,const Point & anchor){return Point(anchor.x+anchor.y-p.y,anchor.y+p.x-anchor.x);};
 const Point start=vertical?upright(from,mobileFromAnchor):from,end=vertical?upright(dest,mobileDestAnchor):dest;
 constexpr double pi=3.14159265358979323846;
 const auto direction=[&](Point velocity){if(vertical)velocity=Point(velocity.y,-velocity.x);return (int(std::lround((std::atan2(double(velocity.y),double(velocity.x))+pi/2)*16/pi))+32)%32;};
 const auto artwork=[&](const std::shared_ptr<CAnimation> & art,int group,Point point,double age,bool loop){if(!art)return;const size_t count=art->size(group);if(!count)return;const size_t frame=loop?size_t(std::max(0.,age)*24)%count:std::min(count-1,size_t(std::max(0.,age)*24));auto image=art->getImage(frame,group,true);if(image)canvas.draw(image,point-Point(image->width()/2,image->height()/2));};
 const auto impact=[&](double begin,Point point){if(progress>=begin)artwork(animation,32,point,(progress-begin)/speed,false);};
 const Point delta=end-start;
 if(kind==1){
  // Eight Interceptors per Carrier, staggered launch, attack orbits, then return.
  for(int i=0;i<fighterCount;++i){const double launch=i*.009;if(progress<launch)continue;const double t=(progress-launch)/(1-launch),angle=2*pi*i/fighterCount,radius=36+(i%4)*10;
   const Point entry=end+Point(std::lround(std::cos(angle)*radius),std::lround(std::sin(angle)*radius)),exit=end+Point(std::lround(std::cos(angle+.34*15)*radius),std::lround(std::sin(angle+.34*15)*radius));
   const auto flight=[&](double phase){if(phase<.38){const double u=std::clamp(phase/.38,0.,1.);return Point(std::lround(start.x+(entry.x-start.x)*u+std::sin(pi*u)*std::cos(angle)*24),std::lround(start.y+(entry.y-start.y)*u+std::sin(pi*u)*std::sin(angle)*24));}if(phase<.72){const double orbit=angle+(phase-.38)*15;return end+Point(std::lround(std::cos(orbit)*radius),std::lround(std::sin(orbit)*radius));}const double u=std::clamp((phase-.72)/.28,0.,1.);return Point(std::lround(exit.x+(start.x-exit.x)*u+std::sin(pi*u)*std::cos(angle)*20),std::lround(exit.y+(start.y-exit.y)*u+std::sin(pi*u)*std::sin(angle)*20));};
   const Point point=flight(t),next=flight(std::min(1.,t+.008));artwork(fighters,direction(next-point),point,elapsed+i*.03,true);
   if(t>.38&&t<.72){const double pulse=std::fmod(t*18+i*.17,1.);const Point shot(std::lround(point.x+(end.x-point.x)*pulse),std::lround(point.y+(end.y-point.y)*pulse));artwork(animation,direction(end-point),shot,elapsed,true);}
  }
  if(progress>.4&&progress<.86)impact(.4,end);
 }else if(kind==2||kind==4){
  // The original Arclite cannon / Psionic Shockwave resolve at their target.
  // Their native impact sprites are not replaced by a generic Heroes beam.
  for(int i=0;i<volleyCount;++i)impact(.12+i*.10,end+Point((i%2)*8-4,(i%3)*5-5));
 }else{
  const int shots=kind==0?std::max(4,volleyCount*3):volleyCount;
  for(int i=0;i<shots;++i){const double launch=i*.045,t=(progress-launch)/.66;if(t<0||t>1)continue;const Point point(std::lround(start.x+delta.x*t),std::lround(start.y+delta.y*t));artwork(animation,direction(delta),point,elapsed+i*.02,true);}
  impact(.67,end);
 }
}

BattleProjectileController::BattleProjectileController(BattleInterface & owner):
	owner(owner)
{}

const CCreature & BattleProjectileController::getShooter(const CStack * stack) const
{
	const CCreature * creature = stack->unitType();

	if(creature->getId() == CreatureID::ARROW_TOWERS)
		creature = owner.siegeController->getTurretCreature(stack->initialPosition);

	if(creature->animation.missileFrameAngles.empty() && creature->animation.projectileRay.empty())
	{
		logAnim->error("Mod error: Creature '%s' on the Archer's tower is not a shooter. Mod should be fixed. Trying to use archer's data instead...", creature->getNameSingularTranslated());
		creature = CreatureID(CreatureID::ARCHER).toCreature();
	}

	return *creature;
}

bool BattleProjectileController::stackUsesRayProjectile(const CStack * stack) const
{
	return !getShooter(stack).animation.projectileRay.empty();
}

bool BattleProjectileController::stackUsesMissileProjectile(const CStack * stack) const
{
	return !getShooter(stack).animation.projectileImageName.empty();
}

void BattleProjectileController::initStackProjectile(const CStack * stack)
{
	if (!stackUsesMissileProjectile(stack))
		return;

	const CCreature & creature = getShooter(stack);
	projectilesCache[creature.animation.projectileImageName] = createProjectileImage(creature.animation.projectileImageName);
}

std::shared_ptr<CAnimation> BattleProjectileController::createProjectileImage(const AnimationPath & path )
{
	std::shared_ptr<CAnimation> projectile = ENGINE->renderHandler().loadAnimation(path, EImageBlitMode::COLORKEY);

	if(path.getOriginalName().starts_with("crossover/weapons/"))return projectile;

	if(projectile->size(1) != 0)
		logAnim->error("Expected empty group 1 in stack projectile");
	else
		projectile->createFlippedGroup(0, 1);

	return projectile;
}

std::shared_ptr<CAnimation> BattleProjectileController::getProjectileImage(const CStack * stack)
{
	const CCreature & creature = getShooter(stack);
	AnimationPath imageName = creature.animation.projectileImageName;

	if (!projectilesCache.count(imageName))
		initStackProjectile(stack);

	return projectilesCache[imageName];
}

void BattleProjectileController::emitStackProjectile(const CStack * stack)
{
	int stackID = stack ? stack->unitId() : -1;

	for (auto projectile : projectiles)
	{
		if ( !projectile->playing && projectile->shooterID == stackID)
		{
			projectile->playing = true;
			return;
		}
	}
}

void BattleProjectileController::render(Canvas & canvas)
{
	for ( auto projectile: projectiles)
	{
		if ( projectile->playing )
			projectile->show(canvas);
	}
}

void BattleProjectileController::tick(uint32_t msPassed)
{
	for ( auto projectile: projectiles)
	{
		if ( projectile->playing )
			projectile->tick(msPassed);
	}

	vstd::erase_if(projectiles, [&](const std::shared_ptr<ProjectileBase> & projectile){
		return projectile->progress > 1.0f;
	});
}

bool BattleProjectileController::hasActiveProjectile(const CStack * stack, bool emittedOnly) const
{
	int stackID = stack ? stack->unitId() : -1;

	for(auto const & instance : projectiles)
	{
		if(instance->shooterID == stackID && (instance->playing || !emittedOnly))
		{
			return true;
		}
	}
	return false;
}

float BattleProjectileController::computeProjectileFlightTime( Point from, Point dest, double animSpeed)
{
	float distanceSquared = (dest.x - from.x) * (dest.x - from.x) + (dest.y - from.y) * (dest.y - from.y);
	float distance = sqrt(distanceSquared);

	assert(distance > 1.f);

	return animSpeed / std::max( 1.f, distance);
}

int BattleProjectileController::computeProjectileFrameID( Point from, Point dest, const CStack * stack)
{
	const CCreature & creature = getShooter(stack);

	auto & angles = creature.animation.missileFrameAngles;
	auto animation = getProjectileImage(stack);

	// only frames below maxFrame are usable: anything  higher is either no present or we don't know when it should be used
	size_t maxFrame = std::min<size_t>(angles.size(), animation->size(0));

	assert(maxFrame > 0);
	double projectileAngle = -atan2(dest.y - from.y, std::abs(dest.x - from.x));

	// values in angles array indicate position from which this frame was rendered, in degrees.
	// possible range is 90 ... -90, where projectile for +90 will be used for shooting upwards, +0 for shots towards right and -90 for downwards shots
	// find frame that has closest angle to one that we need for this shot
	int bestID = 0;
	double bestDiff = fabs( angles[0] / 180 * M_PI - projectileAngle );

	for (int i=1; i<maxFrame; i++)
	{
		double currentDiff = fabs( angles[i] / 180 * M_PI - projectileAngle );
		if (currentDiff < bestDiff)
		{
			bestID = i;
			bestDiff = currentDiff;
		}
	}
	return bestID;
}

void BattleProjectileController::createCatapultProjectile(const CStack * shooter, Point from, Point dest)
{
	auto catapultProjectile       = new ProjectileCatapult();

	catapultProjectile->animation = getProjectileImage(shooter);
	catapultProjectile->progress  = 0;
	catapultProjectile->speed     = computeProjectileFlightTime(from, dest, AnimationControls::getCatapultSpeed());
	catapultProjectile->from      = from;
	catapultProjectile->dest      = dest;
	catapultProjectile->shooterID = shooter->unitId();
	catapultProjectile->playing   = false;
	catapultProjectile->frameProgress = 0.f;

	projectiles.push_back(std::shared_ptr<ProjectileBase>(catapultProjectile));
}

void BattleProjectileController::createProjectile(const CStack * shooter, Point from, Point dest, const CStack * target)
{
	const CCreature & shooterInfo = getShooter(shooter);

	std::shared_ptr<ProjectileBase> projectile;
	if (stackUsesRayProjectile(shooter) && stackUsesMissileProjectile(shooter))
	{
		logAnim->error("Mod error: Creature '%s' has both missile and ray projectiles configured. Mod should be fixed. Using ray projectile configuration...", shooterInfo.getNameSingularTranslated());
	}

 if(shooterInfo.animation.projectileImageName.getOriginalName().starts_with("crossover/weapons/"))
 {
  auto native=std::make_shared<ProjectileStarcraft>();native->animation=getProjectileImage(shooter);const auto key=shooterInfo.getJsonKey();
  native->kind=key.ends_with(":carrier")?1:key.ends_with(":siegeTank")?2:key.ends_with(":guardian")?3:key.ends_with(":archon")?4:0;
  native->volleyCount=std::clamp<int64_t>(shooter->getCount(),1,3);native->fighterCount=std::clamp<int64_t>(shooter->getCount()*8,8,32);
  native->speed=native->kind==1?1.f/1.8f:native->kind==2?1.f/.75f:native->kind==3?1.f/.9f:1.f/.8f;
  if(native->kind==1){const auto path=AnimationPath::builtin("crossover/weapons/interceptor");auto & art=projectilesCache[path];if(!art)art=createProjectileImage(path);native->fighters=art;}
  projectile=native;
 }
 else if (stackUsesRayProjectile(shooter))
 {
		auto rayProjectile = new ProjectileRay();
		projectile.reset(rayProjectile);

		rayProjectile->rayConfig = shooterInfo.animation.projectileRay;
		rayProjectile->speed     = computeProjectileFlightTime(from, dest, AnimationControls::getRayProjectileSpeed());
		const float minimumFlightTime = std::max(0.35f, shooterInfo.animation.minimumRayFlightTime);
		if(minimumFlightTime > 0)
			rayProjectile->speed = std::min(rayProjectile->speed, 1.0f / minimumFlightTime);
	}
	else if (stackUsesMissileProjectile(shooter))
	{
		auto missileProjectile = new ProjectileMissile();
		projectile.reset(missileProjectile);

		missileProjectile->animation = getProjectileImage(shooter);
		missileProjectile->reverse   = !owner.stacksController->facingRight(shooter);
		missileProjectile->frameNum  = computeProjectileFrameID(from, dest, shooter);
		missileProjectile->speed     = computeProjectileFlightTime(from, dest, AnimationControls::getProjectileSpeed());
	}


 // Malformed creature data must not dereference an empty projectile in battle.
 if(!projectile){
  logAnim->error("Creature '%s' has no usable projectile; using a visible fallback ray",shooterInfo.getNameSingularTranslated());
  auto ray=std::make_shared<ProjectileRay>();ray->rayConfig.push_back({ColorRGBA(255,225,160,255),ColorRGBA(255,130,70,255)});
  ray->speed=std::min(computeProjectileFlightTime(from,dest,AnimationControls::getRayProjectileSpeed()),1.0f/0.35f);projectile=ray;
 }

 projectile->mobileAnchored=shooter->getPosition().isValid()&&target&&target->getPosition().isValid();
 if(projectile->mobileAnchored){
  projectile->mobileFromAnchor=owner.fieldController->hexPositionAbsolute(shooter->getPosition()).center();
  projectile->mobileDestAnchor=owner.fieldController->hexPositionAbsolute(target->getPosition()).center();
 }
	projectile->from      = from;
	projectile->dest      = dest;
	projectile->shooterID = shooter->unitId();
	projectile->progress  = 0;
	projectile->playing   = false;

	projectiles.push_back(projectile);
}

void BattleProjectileController::createSourceDungeonChainArc(const CStack * previous,const CStack * target)
{
    auto projectile=std::make_shared<ProjectileRay>();
    // Original5A67EF color301 dispatches5A5CC3 (raw16-bit), not one of the
    // palette presets. RGB5650x012D expands to(0,36,107). Keep endpoints
    // anchored independently so portrait camera transforms cannot rotate a
    // chain around the previous creature or move the impact to another hex.
    const ColorRGBA color(0,36,107,255);
    projectile->rayConfig.assign(9,{color,color});
    projectile->mobileFromAnchor=owner.fieldController->hexPositionAbsolute(previous->getPosition()).center();
    projectile->mobileDestAnchor=owner.fieldController->hexPositionAbsolute(target->getPosition()).center();
    projectile->mobileAnchored=true;
    projectile->from=projectile->mobileFromAnchor+Point(0,-38);
    projectile->dest=projectile->mobileDestAnchor+Point(0,-38);
    projectile->shooterID=previous->unitId();projectile->progress=0;
    projectile->speed=1.0f/0.35f;projectile->playing=true;
    projectiles.push_back(projectile);
}

void BattleProjectileController::createSpellProjectile(const CStack * shooter, Point from, Point dest, const CSpell * spell)
{
	double projectileAngle = std::abs(atan2(dest.x - from.x, dest.y - from.y));
	AnimationPath animToDisplay = spell->animationInfo.selectProjectile(projectileAngle);

	assert(!animToDisplay.empty());

	if(!animToDisplay.empty())
	{
		auto projectile = new ProjectileAnimatedMissile();

		projectile->animation     = createProjectileImage(animToDisplay);
		projectile->frameProgress = 0;
		projectile->frameNum      = 0;
		projectile->reverse       = from.x > dest.x;
		projectile->from          = from;
		projectile->dest          = dest;
		projectile->shooterID     = shooter ? shooter->unitId() : -1;
		projectile->progress      = 0;
		projectile->speed         = computeProjectileFlightTime(from, dest, AnimationControls::getProjectileSpeed());
		projectile->playing       = false;

		projectiles.push_back(std::shared_ptr<ProjectileBase>(projectile));
	}
}
