-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `isOnline` BOOLEAN NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `accountOwner` BOOLEAN NOT NULL,
    `locale` VARCHAR(191) NULL,
    `collaborator` BOOLEAN NOT NULL,
    `emailVerified` BOOLEAN NOT NULL,

    UNIQUE INDEX `Session_id_key`(`id`),
    UNIQUE INDEX `Session_shop_key`(`shop`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `stripePublishKey` VARCHAR(191) NULL,
    `stripeSecretKey` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `shop` VARCHAR(191) NOT NULL,
    `premiumUser` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_id_key`(`id`),
    UNIQUE INDEX `User_shop_key`(`shop`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL,
    `stripePublishKey` VARCHAR(191) NULL,
    `stripeSecretKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Admin_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `PremiumPurchase` (
--     `id` VARCHAR(191) NOT NULL,
--     `userId` VARCHAR(191) NOT NULL,
--     `purchaseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

--     UNIQUE INDEX `PremiumPurchase_id_key`(`id`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_url` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `subscription_id` VARCHAR(191) NULL,
    `subscription_status` VARCHAR(191) NULL,
    `sub_cancel_date` VARCHAR(191) NULL,
    `sub_update_date` VARCHAR(191) NULL,
    `created_date` VARCHAR(191) NULL,

    -- UNIQUE INDEX `SubscriptionUser_shop_url_key`(`shop_url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
