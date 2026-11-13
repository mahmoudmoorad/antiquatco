"""
Management command to seed test data for local API testing.
Usage: python manage.py seed_local_data
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.catalog.models import Category, Product
from apps.customers.models import CustomerAddress
from apps.store_settings.models import StoreSetting

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds initial accounts, catalog, addresses, and store settings for local testing."

    def handle(self, *args, **options):
        self.stdout.write("Seeding ANTIKATKO local test data...")

        # 1. Admin User
        admin, created = User.objects.get_or_create(
            email="admin@antikatko.com",
            defaults={
                "username": "admin",
                "first_name": "Admin",
                "last_name": "Antikatko",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("AdminPass123!")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin: admin@antikatko.com / AdminPass123!"))
        else:
            self.stdout.write("Admin user already exists.")

        # 2. Customer User
        customer, created = User.objects.get_or_create(
            email="customer@antikatko.com",
            defaults={
                "username": "customer",
                "first_name": "Seif",
                "last_name": "Taher",
                "phone_number": "+201012345678",
                "role": User.Role.CUSTOMER,
            },
        )
        if created:
            customer.set_password("CustomerPass123!")
            customer.save()
            self.stdout.write(self.style.SUCCESS("Created customer: customer@antikatko.com / CustomerPass123!"))
        else:
            self.stdout.write("Customer user already exists.")

        # 3. Customer Address
        CustomerAddress.objects.get_or_create(
            user=customer,
            title="Home",
            defaults={
                "recipient_name": "Seif Taher",
                "phone_number": "+201012345678",
                "governorate": "Cairo",
                "city": "Zamalek",
                "street_address": "12 Brazil Street, 3rd Floor",
                "building_number": "12",
                "floor_number": "3",
                "apartment_number": "301",
                "is_default": True,
            },
        )

        # 4. Dummy Image for Products
        tiny_gif = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
            b"\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
            b"\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
        )

        # 5. Categories
        cat_chairs, _ = Category.objects.get_or_create(
            slug="vintage-chairs",
            defaults={
                "name_en": "Vintage Chairs",
                "name_ar": "كراسي أنتيك",
                "description_en": "Handcrafted antique armchairs and parlor seats",
                "description_ar": "كراسي ومقاعد كلاسيكية مصنوعة يدوياً",
                "is_active": True,
            },
        )
        cat_mirrors, _ = Category.objects.get_or_create(
            slug="antique-mirrors",
            defaults={
                "name_en": "Antique Mirrors",
                "name_ar": "مرايا أنتيك",
                "description_en": "Ornate baroque and gilded wall mirrors",
                "description_ar": "مرايا حائط مذهبة ونقوش باروك كلاسيكية",
                "is_active": True,
            },
        )
        cat_clocks, _ = Category.objects.get_or_create(
            slug="vintage-clocks",
            defaults={
                "name_en": "Vintage Clocks",
                "name_ar": "ساعات أنتيك",
                "description_en": "Grandfather and mantle antique pendulum clocks",
                "description_ar": "ساعات بندول ومكتب أنتيك نادرة",
                "is_active": True,
            },
        )

        # 6. Products
        Product.objects.get_or_create(
            slug="victorian-velvet-armchair",
            defaults={
                "category": cat_chairs,
                "name_en": "Victorian Velvet Armchair",
                "name_ar": "كرسي مخملي فكتوري",
                "description_en": "Authentic 19th-century carved walnut armchair with burgundy velvet upholstery.",
                "description_ar": "كرسي أصلي من القرن التاسع عشر مصنوع من خشب الجوز المحفور مع تنجيد مخمل نبيتي.",
                "price": Decimal("5500.00"),
                "original_price": Decimal("6200.00"),
                "stock": 4,
                "main_image": SimpleUploadedFile("chair.jpg", tiny_gif, content_type="image/jpeg"),
                "is_active": True,
                "is_featured": True,
            },
        )

        Product.objects.get_or_create(
            slug="french-baroque-gilded-mirror",
            defaults={
                "category": cat_mirrors,
                "name_en": "French Baroque Gilded Mirror",
                "name_ar": "مرآة باروكية فرنسية مذهبة",
                "description_en": "Exquisite gold-leaf hand-carved floral border with original beveled glass.",
                "description_ar": "إطار مذهب بورق الذهب ونقوش زهرية محفورة يدوياً مع زجاج أصلي مشطوف.",
                "price": Decimal("3800.00"),
                "original_price": Decimal("4200.00"),
                "stock": 2,
                "main_image": SimpleUploadedFile("mirror.jpg", tiny_gif, content_type="image/jpeg"),
                "is_active": True,
                "is_featured": True,
            },
        )

        Product.objects.get_or_create(
            slug="antique-brass-mantel-clock",
            defaults={
                "category": cat_clocks,
                "name_en": "Antique Brass Mantel Clock",
                "name_ar": "ساعة مكتب نحاسية أنتيك",
                "description_en": "Working mechanical wind-up mantle clock with Roman numeral porcelain dial.",
                "description_ar": "ساعة مكتب ميكانيكية تعمل بالتعبئة مع ميناء خزفي بالأرقام الرومانية.",
                "price": Decimal("2900.00"),
                "stock": 1,
                "main_image": SimpleUploadedFile("clock.jpg", tiny_gif, content_type="image/jpeg"),
                "is_active": True,
            },
        )

        # 7. Store Settings
        settings_defaults = {
            "shipping_fee": "100.00",
            "currency": "EGP",
            "store_phone": "+201012345678",
            "store_email": "info@antikatko.com",
            "vodafone_cash_number": "+201012345678",
            "instapay_address": "antikatko@instapay",
            "store_address_en": "15 Zamalek Antique Row, Cairo, Egypt",
            "store_address_ar": "١٥ شارع التحف والانتيكات، الزمالك، القاهرة",
        }
        for k, v in settings_defaults.items():
            StoreSetting.objects.get_or_create(key=k, defaults={"value": v})

        self.stdout.write(self.style.SUCCESS("Local test data seeded successfully!"))
