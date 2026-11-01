/*
 * CUnitStateTest.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */

#include "StdInc.h"
#include "mock/mock_BonusBearer.h"
#include "mock/mock_UnitInfo.h"
#include "mock/mock_UnitEnvironment.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/CCreatureHandler.h"

namespace test
{
using namespace ::testing;

static const int32_t DEFAULT_HP = 123;
static const int32_t DEFAULT_AMOUNT = 100;
static const int32_t DEFAULT_SPEED = 10;
static const BattleHex DEFAULT_POSITION = BattleHex(5, 5);
static const int DEFAULT_ATTACK = 58;
static const int DEFAULT_DEFENCE = 63;

class UnitStateTest : public Test
{
public:
	UnitInfoMock infoMock;
	UnitEnvironmentMock envMock;
	BonusBearerMock bonusMock;

	const CCreature * pikeman;

	battle::CUnitStateDetached subject;

	bool hasAmmoCart;

	UnitStateTest()
		:infoMock(),
		envMock(),
		bonusMock(),
		subject(&infoMock, &bonusMock),
		hasAmmoCart(false)
	{
		pikeman = CreatureID(0).toCreature();
	}

	void setDefaultExpectations()
	{
		bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::STACKS_SPEED, BonusSource::CREATURE_ABILITY, DEFAULT_SPEED, BonusSourceID()));

		bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::PRIMARY_SKILL, BonusSource::CREATURE_ABILITY, DEFAULT_ATTACK, BonusSourceID(), BonusSubtypeID(PrimarySkill::ATTACK)));
		bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::PRIMARY_SKILL, BonusSource::CREATURE_ABILITY, DEFAULT_DEFENCE, BonusSourceID(), BonusSubtypeID(PrimarySkill::DEFENSE)));

		bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::STACK_HEALTH, BonusSource::CREATURE_ABILITY, DEFAULT_HP, BonusSourceID()));

		EXPECT_CALL(infoMock, unitBaseAmount()).WillRepeatedly(Return(DEFAULT_AMOUNT));
		EXPECT_CALL(infoMock, unitType()).WillRepeatedly(Return(pikeman));

		EXPECT_CALL(envMock, unitHasAmmoCart(_)).WillRepeatedly(Return(hasAmmoCart));
	}

	void makeShooter(int32_t ammo)
	{
		bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::SHOOTER, BonusSource::CREATURE_ABILITY, 1, BonusSourceID()));
		bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::SHOTS, BonusSource::CREATURE_ABILITY, ammo, BonusSourceID()));
	}

	void initUnit()
	{
		subject.localInit(&envMock);
		subject.position = DEFAULT_POSITION;
	}
};

TEST_F(UnitStateTest, initialRegular)
{
	setDefaultExpectations();
	initUnit();

	EXPECT_TRUE(subject.alive());
	EXPECT_TRUE(subject.ableToRetaliate());
	EXPECT_FALSE(subject.isGhost());
	EXPECT_FALSE(subject.isDead());
	EXPECT_FALSE(subject.isTurret());
	EXPECT_TRUE(subject.isValidTarget(true));
	EXPECT_TRUE(subject.isValidTarget(false));

	EXPECT_FALSE(subject.isClone());
	EXPECT_FALSE(subject.hasClone());

	EXPECT_FALSE(subject.canCast());
	EXPECT_FALSE(subject.isCaster());
	EXPECT_FALSE(subject.canShoot());
	EXPECT_FALSE(subject.isShooter());

	EXPECT_EQ(subject.getCount(), DEFAULT_AMOUNT);
	EXPECT_EQ(subject.getFirstHPleft(), DEFAULT_HP);
	EXPECT_EQ(subject.getKilled(), 0);
	EXPECT_EQ(subject.getAvailableHealth(), DEFAULT_HP * DEFAULT_AMOUNT);
	EXPECT_EQ(subject.getTotalHealth(), subject.getAvailableHealth());

	EXPECT_EQ(subject.getPosition(), DEFAULT_POSITION);

	EXPECT_EQ(subject.getInitiative(), DEFAULT_SPEED);
	EXPECT_EQ(subject.getInitiative(123456), DEFAULT_SPEED);

	EXPECT_TRUE(subject.canMove());
	EXPECT_TRUE(subject.canMove(123456));
	EXPECT_FALSE(subject.defended());
	EXPECT_FALSE(subject.defended(123456));
	EXPECT_FALSE(subject.moved());
	EXPECT_FALSE(subject.moved(123456));
	EXPECT_TRUE(subject.willMove());
	EXPECT_TRUE(subject.willMove(123456));
	EXPECT_FALSE(subject.waited());
	EXPECT_FALSE(subject.waited(123456));

	EXPECT_EQ(subject.getTotalAttacks(true), 1);
	EXPECT_EQ(subject.getTotalAttacks(false), 1);
}

TEST_F(UnitStateTest, canShoot)
{
	setDefaultExpectations();
	makeShooter(1);
	initUnit();

	EXPECT_FALSE(subject.canCast());
	EXPECT_FALSE(subject.isCaster());
	EXPECT_TRUE(subject.canShoot());
	EXPECT_TRUE(subject.isShooter());

	subject.afterAttack(true, false);

	EXPECT_FALSE(subject.canShoot());
	EXPECT_TRUE(subject.isShooter());
}

TEST_F(UnitStateTest, canShootWithAmmoCart)
{
	hasAmmoCart = true;
	setDefaultExpectations();
	makeShooter(1);
	initUnit();

	EXPECT_FALSE(subject.canCast());
	EXPECT_FALSE(subject.isCaster());
	EXPECT_TRUE(subject.canShoot());
	EXPECT_TRUE(subject.isShooter());

	subject.afterAttack(true, false);

	EXPECT_TRUE(subject.canShoot());
	EXPECT_TRUE(subject.isShooter());
}

TEST_F(UnitStateTest, getAttack)
{
	setDefaultExpectations();

	EXPECT_EQ(subject.getAttack(false), DEFAULT_ATTACK);
	EXPECT_EQ(subject.getAttack(true), DEFAULT_ATTACK);
}

TEST_F(UnitStateTest, getDefense)
{
	setDefaultExpectations();

	EXPECT_EQ(subject.getDefense(false), DEFAULT_DEFENCE);
	EXPECT_EQ(subject.getDefense(true), DEFAULT_DEFENCE);
}

TEST_F(UnitStateTest, attackWithFrenzy)
{
	setDefaultExpectations();

	bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::IN_FRENZY, BonusSource::SPELL_EFFECT, 50, BonusSourceID()));

	int expectedAttack = static_cast<int>(DEFAULT_ATTACK + 0.5 * DEFAULT_DEFENCE);

	EXPECT_EQ(subject.getAttack(false), expectedAttack);
	EXPECT_EQ(subject.getAttack(true), expectedAttack);
}

TEST_F(UnitStateTest, defenceWithFrenzy)
{
	setDefaultExpectations();

	bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::IN_FRENZY, BonusSource::SPELL_EFFECT, 50, BonusSourceID()));

	int expectedDefence = 0;

	EXPECT_EQ(subject.getDefense(false), expectedDefence);
	EXPECT_EQ(subject.getDefense(true), expectedDefence);
}

TEST_F(UnitStateTest, additionalAttack)
{
	setDefaultExpectations();

	{
		auto bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::ADDITIONAL_ATTACK, BonusSource::SPELL_EFFECT, 41, BonusSourceID());

		bonusMock.addNewBonus(bonus);
	}

	EXPECT_EQ(subject.getTotalAttacks(false), 42);
	EXPECT_EQ(subject.getTotalAttacks(true), 42);
}

TEST_F(UnitStateTest, additionalMeleeAttack)
{
	setDefaultExpectations();

	{
		auto bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::ADDITIONAL_ATTACK, BonusSource::SPELL_EFFECT, 41, BonusSourceID());
		bonus->effectRange = BonusLimitEffect::ONLY_MELEE_FIGHT;

		bonusMock.addNewBonus(bonus);
	}

	EXPECT_EQ(subject.getTotalAttacks(false), 42);
	EXPECT_EQ(subject.getTotalAttacks(true), 1);
}

TEST_F(UnitStateTest, hypnotized)
{
	setDefaultExpectations();

	{
		auto bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::HYPNOTIZED, BonusSource::SPELL_EFFECT, 41, BonusSourceID());

		bonusMock.addNewBonus(bonus);
	}

	EXPECT_TRUE(subject.isHypnotized());
}

TEST_F(UnitStateTest, additionalRangedAttack)
{
	setDefaultExpectations();

	{
		auto bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::ADDITIONAL_ATTACK, BonusSource::SPELL_EFFECT, 41, BonusSourceID());
		bonus->effectRange = BonusLimitEffect::ONLY_DISTANCE_FIGHT;

		bonusMock.addNewBonus(bonus);
	}

	EXPECT_EQ(subject.getTotalAttacks(false), 1);
	EXPECT_EQ(subject.getTotalAttacks(true), 42);
}

TEST_F(UnitStateTest, getMinDamage)
{
	setDefaultExpectations();

	{
		auto bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::CREATURE_DAMAGE, BonusSource::SPELL_EFFECT, 30, BonusSourceID(), BonusCustomSubtype::creatureDamageBoth);
		bonusMock.addNewBonus(bonus);

		bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::CREATURE_DAMAGE, BonusSource::SPELL_EFFECT, -20, BonusSourceID(), BonusCustomSubtype::creatureDamageMin);
		bonus->effectRange = BonusLimitEffect::ONLY_DISTANCE_FIGHT;
		bonusMock.addNewBonus(bonus);

		bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::CREATURE_DAMAGE, BonusSource::SPELL_EFFECT, -10, BonusSourceID(), BonusCustomSubtype::creatureDamageMin);
		bonus->effectRange = BonusLimitEffect::ONLY_MELEE_FIGHT;
		bonusMock.addNewBonus(bonus);

	}

	EXPECT_EQ(subject.getMinDamage(false), 20);
	EXPECT_EQ(subject.getMinDamage(true), 10);
}

TEST_F(UnitStateTest, getMaxDamage)
{
	setDefaultExpectations();

	{
		auto bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::CREATURE_DAMAGE, BonusSource::SPELL_EFFECT, 30, BonusSourceID(), BonusCustomSubtype::creatureDamageBoth);
		bonusMock.addNewBonus(bonus);

		bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::CREATURE_DAMAGE, BonusSource::SPELL_EFFECT, -20, BonusSourceID(), BonusCustomSubtype::creatureDamageMax);
		bonus->effectRange = BonusLimitEffect::ONLY_DISTANCE_FIGHT;
		bonusMock.addNewBonus(bonus);

		bonus = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::CREATURE_DAMAGE, BonusSource::SPELL_EFFECT, -10, BonusSourceID(), BonusCustomSubtype::creatureDamageMax);
		bonus->effectRange = BonusLimitEffect::ONLY_MELEE_FIGHT;
		bonusMock.addNewBonus(bonus);
	}

	EXPECT_EQ(subject.getMaxDamage(false), 20);
	EXPECT_EQ(subject.getMaxDamage(true), 10);
}

TEST_F(UnitStateTest, eraStatusHealthPreservesWoundsAndComposesFlatHealth)
{
    setDefaultExpectations();
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT,
        BonusType::ERA_SOURCE_STATUS_HEALTH,BonusSource::CREATURE_ABILITY,1,BonusSourceID()));
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT,
        BonusType::STACK_HEALTH,BonusSource::ARTIFACT,2,BonusSourceID()));
    initUnit();
    ASSERT_EQ(subject.getMaxHealth(),125u);
    int64_t damage=20;subject.health.damage(damage);
    ASSERT_EQ(subject.getFirstHPleft(),105);
    const auto count=subject.getCount();
    auto age=std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-50,BonusSourceID(SpellID(SpellID::AGE)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL);
    age->turnsRemain=3;bonusMock.addNewBonus(age);
    subject.health.sourceMaximumChanged(125);
    EXPECT_EQ(subject.getMaxHealth(),63u);
    EXPECT_EQ(subject.getFirstHPleft(),43);
    EXPECT_EQ(subject.getCount(),count);
    auto poison=std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-10,BonusSourceID(SpellID(SpellID::POISON)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL);
    poison->turnsRemain=3;bonusMock.addNewBonus(poison);
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::POISON,
        BonusSource::SPELL_EFFECT,50,BonusSourceID(SpellID(SpellID::POISON))));
    subject.health.sourceMaximumChanged(63);
    EXPECT_EQ(subject.getMaxHealth(),57u);
    EXPECT_EQ(subject.getFirstHPleft(),37);
    // Reapplication updates only duration, not progression or already lost HP.
    poison->turnsRemain=std::max(poison->turnsRemain,3);
    subject.health.sourceMaximumChanged(57);
    EXPECT_EQ(poison->val,-10);EXPECT_EQ(subject.getFirstHPleft(),37);
    bonusMock.removeBonus(age);
    subject.health.sourceMaximumChanged(57);
    EXPECT_EQ(subject.getMaxHealth(),113u);EXPECT_EQ(subject.getFirstHPleft(),93);
    bonusMock.removeBonus(poison);
    subject.health.sourceMaximumChanged(113);
    EXPECT_EQ(subject.getMaxHealth(),125u);EXPECT_EQ(subject.getFirstHPleft(),105);
    EXPECT_EQ(subject.getCount(),count);EXPECT_EQ(subject.health.getResurrected(),0);
}

TEST_F(UnitStateTest, eraStatusHealthClampNeverKillsAndExpiryRestoresWounds)
{
    setDefaultExpectations();
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT,
        BonusType::ERA_SOURCE_STATUS_HEALTH,BonusSource::CREATURE_ABILITY,1,BonusSourceID()));
    initUnit();
    int64_t damage=100;subject.health.damage(damage);
    auto age=std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-50,BonusSourceID(SpellID(SpellID::AGE)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL);
    bonusMock.addNewBonus(age);subject.health.sourceMaximumChanged(123);
    EXPECT_EQ(subject.getMaxHealth(),62u);EXPECT_EQ(subject.getFirstHPleft(),1);
    EXPECT_EQ(subject.getCount(),DEFAULT_AMOUNT);
    bonusMock.removeBonus(age);subject.health.sourceMaximumChanged(62);
    EXPECT_EQ(subject.getMaxHealth(),123u);EXPECT_EQ(subject.getFirstHPleft(),62);
    EXPECT_EQ(subject.getCount(),DEFAULT_AMOUNT);
}

TEST_F(UnitStateTest, customAgeStrengthKeepsNativeHealthPipeline)
{
    setDefaultExpectations();
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT,
        BonusType::ERA_SOURCE_STATUS_HEALTH,BonusSource::CREATURE_ABILITY,1,BonusSourceID()));
    initUnit();
    auto age=std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-25,BonusSourceID(SpellID(SpellID::AGE)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL);
    bonusMock.addNewBonus(age);
    EXPECT_EQ(subject.getMaxHealth(),92u);
}

TEST_F(UnitStateTest, unprofiledStatusHealthKeepsNativeRounding)
{
    setDefaultExpectations();initUnit();
    auto age=std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-50,BonusSourceID(SpellID(SpellID::AGE)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL);
    bonusMock.addNewBonus(age);
    EXPECT_EQ(subject.getMaxHealth(),61u);
}

TEST_F(UnitStateTest, eraNonstandardPoisonKeepsNativeHealthFallback)
{
    setDefaultExpectations();
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::PERMANENT,
        BonusType::ERA_SOURCE_STATUS_HEALTH,BonusSource::CREATURE_ABILITY,1,BonusSourceID()));
    initUnit();
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-50,BonusSourceID(SpellID(SpellID::AGE)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL));
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::STACK_HEALTH,
        BonusSource::SPELL_EFFECT,-15,BonusSourceID(SpellID(SpellID::POISON)),BonusSubtypeID(),BonusValueType::PERCENT_TO_ALL));
    bonusMock.addNewBonus(std::make_shared<Bonus>(BonusDuration::N_TURNS,BonusType::POISON,
        BonusSource::SPELL_EFFECT,37,BonusSourceID(SpellID(SpellID::POISON))));
    EXPECT_EQ(subject.getMaxHealth(),43u); // native123*(100-50-15)/100
}

}
