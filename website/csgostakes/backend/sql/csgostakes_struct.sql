/*
SQLyog Community v12.4.3 (64 bit)
MySQL - 5.7.19-0ubuntu0.16.04.1 : Database - csgostakes
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`csgostakes` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `csgostakes`;

/*Table structure for table `admin_user` */

DROP TABLE IF EXISTS `admin_user`;

CREATE TABLE `admin_user` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(256) NOT NULL,
  `bot_admin` tinyint(1) DEFAULT '0',
  `offer_admin` tinyint(1) DEFAULT '0',
  `chat_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

/*Table structure for table `bot` */

DROP TABLE IF EXISTS `bot`;

CREATE TABLE `bot` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `host` varchar(30) DEFAULT NULL,
  `account_name` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `shared_secret` varchar(30) NOT NULL,
  `identity_secret` varchar(30) NOT NULL,
  `steam_id` varchar(20) NOT NULL,
  `bot_type` tinyint(4) NOT NULL DEFAULT '1' COMMENT '1 = Inventory, 2 = Giveaway',
  `state` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

/*Table structure for table `chat` */

DROP TABLE IF EXISTS `chat`;

CREATE TABLE `chat` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` text CHARACTER SET utf8 NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2448 DEFAULT CHARSET=latin1;

/*Table structure for table `deposit` */

DROP TABLE IF EXISTS `deposit`;

CREATE TABLE `deposit` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bot_id` int(11) DEFAULT NULL,
  `items` text CHARACTER SET utf8mb4 NOT NULL,
  `offer_id` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `offer_state` tinyint(4) DEFAULT NULL,
  `offer_response` text CHARACTER SET utf8,
  `received_items` text CHARACTER SET utf8mb4,
  `state` smallint(4) NOT NULL DEFAULT '1' COMMENT '0 = Error, 1 = new deposit, 2 = offer sent, 3 = accepted, 4 = items assigned',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1252 DEFAULT CHARSET=latin1;

/*Table structure for table `game` */

DROP TABLE IF EXISTS `game`;

CREATE TABLE `game` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `game_winner` int(11) DEFAULT NULL,
  `game_hash` varchar(256) NOT NULL,
  `game_secret` varchar(50) NOT NULL,
  `game_winage` varchar(20) NOT NULL,
  `game_value` decimal(10,2) DEFAULT NULL,
  `game_type` varchar(50) NOT NULL DEFAULT 'coinflip',
  `state` tinyint(4) DEFAULT NULL COMMENT '0 = Inactive, 1 = Active, 2 = Locked, 3 = Joined, 4 = Winner Calculated, 5 = Comission Calculated, 6 = Expired',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4726 DEFAULT CHARSET=latin1;

/*Table structure for table `game_inventory` */

DROP TABLE IF EXISTS `game_inventory`;

CREATE TABLE `game_inventory` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20133 DEFAULT CHARSET=latin1;

/*Table structure for table `game_player` */

DROP TABLE IF EXISTS `game_player`;

CREATE TABLE `game_player` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `total_value` decimal(10,2) NOT NULL,
  `start_tickets` int(11) DEFAULT NULL,
  `end_tickets` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8189 DEFAULT CHARSET=latin1;

/*Table structure for table `inventory` */

DROP TABLE IF EXISTS `inventory`;

CREATE TABLE `inventory` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bot_id` int(11) NOT NULL,
  `mhash` varchar(256) CHARACTER SET utf8mb4 NOT NULL,
  `asset_id` varchar(20) CHARACTER SET utf8 NOT NULL,
  `class_id` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  `image` text CHARACTER SET utf8 NOT NULL,
  `rarity_color` varchar(10) CHARACTER SET utf8 DEFAULT NULL,
  `rarity_tag_name` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `asset_uuid` varchar(30) CHARACTER SET utf8 NOT NULL,
  `state` tinyint(4) NOT NULL DEFAULT '0',
  `notes` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`asset_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=3908 DEFAULT CHARSET=latin1 CHECKSUM=1 DELAY_KEY_WRITE=1 ROW_FORMAT=DYNAMIC;

/*Table structure for table `ticket` */

DROP TABLE IF EXISTS `ticket`;

CREATE TABLE `ticket` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `department` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment` text COLLATE utf8mb4_unicode_ci,
  `status` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `ticket_reply` */

DROP TABLE IF EXISTS `ticket_reply`;

CREATE TABLE `ticket_reply` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `profile_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
  `profile_url` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `avatar` varchar(256) CHARACTER SET utf8 NOT NULL,
  `avatar_medium` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `steam_id` varchar(20) CHARACTER SET utf8 NOT NULL,
  `trade_url` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `role_id` tinyint(4) DEFAULT '0' COMMENT '0 = normal, 1 = chat admin',
  `is_banned` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_chat_banned` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1213 DEFAULT CHARSET=latin1;

/*Table structure for table `withdraw` */

DROP TABLE IF EXISTS `withdraw`;

CREATE TABLE `withdraw` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `offer_id` varchar(50) DEFAULT NULL,
  `offer_state` tinyint(4) DEFAULT NULL,
  `offer_response` text,
  `state` smallint(4) DEFAULT '1' COMMENT '0 = Error, 1 = new withdraw request, 2 = offer sent, 3 = offer accepted, 4 = items deassigned.',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1250 DEFAULT CHARSET=latin1;

/*Table structure for table `withdraw_item` */

DROP TABLE IF EXISTS `withdraw_item`;

CREATE TABLE `withdraw_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `withdraw_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3568 DEFAULT CHARSET=latin1;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
