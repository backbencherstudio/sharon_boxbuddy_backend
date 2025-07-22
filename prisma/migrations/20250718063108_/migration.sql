-- CreateEnum
CREATE TYPE "PickUpPerson" AS ENUM ('your_self', 'a_trustworthy_person');

-- CreateEnum
CREATE TYPE "DropOffPerson" AS ENUM ('your_self', 'a_trustworthy_person');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('in_progress', 'pick_up', 'on_the_way', 'delivered', 'cancel');

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "depth" TEXT NOT NULL,
    "width" TEXT NOT NULL,
    "is_electronic" BOOLEAN NOT NULL,
    "photo" TEXT NOT NULL,
    "pick_up_location" TEXT NOT NULL,
    "pick_up_parson" "PickUpPerson" NOT NULL,
    "drop_off_location" TEXT NOT NULL,
    "drop_off_parson" "DropOffPerson" NOT NULL,
    "publish" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "traveller_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "shot_description" TEXT NOT NULL,
    "details_description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "pick_up_photo" TEXT NOT NULL,
    "pick_up_owner_sign" TEXT NOT NULL,
    "pick_up_traveller_sign" TEXT NOT NULL,
    "delivery_photo" TEXT NOT NULL,
    "delivery_time_owner_sign" TEXT NOT NULL,
    "delivery_time_traveller_sign" TEXT NOT NULL,
    "cancel" BOOLEAN NOT NULL,
    "cancel_reason" TEXT NOT NULL,
    "cancel_description" TEXT,
    "cancel_by_id" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "traveller_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Travel" (
    "id" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "departure_radius" TEXT NOT NULL,
    "arrival" TEXT NOT NULL,
    "arrival_radius" TEXT NOT NULL,
    "number_of_checked_bags" JSONB NOT NULL,
    "number_of_cabin_bags" JSONB NOT NULL,
    "accept_electronic_items" BOOLEAN NOT NULL,
    "trip_details" TEXT NOT NULL,
    "publish" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Travel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "review_text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewById" TEXT NOT NULL,
    "reviewForId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemWithPackage" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo" TEXT NOT NULL,

    CONSTRAINT "ProblemWithPackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_traveller_id_fkey" FOREIGN KEY ("traveller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_cancel_by_id_fkey" FOREIGN KEY ("cancel_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_traveller_id_fkey" FOREIGN KEY ("traveller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewById_fkey" FOREIGN KEY ("reviewById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewForId_fkey" FOREIGN KEY ("reviewForId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
