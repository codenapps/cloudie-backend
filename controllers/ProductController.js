
import { v2 as cloudinary } from "cloudinary";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import CategoryModel from "../models/CategoryModel.js";
import ProductModel from "../models/ProductModel.js";
import User from "../models/User.js";
import AdminModel from "../models/AdminModel.js";

// @POST
// /api/products/create-product/:storeID
const HandleCreateProduct = async (req, res) => {
    try {
        const { storeID } = req.params;
        const {
            title,
            desc,
            slug,
            isVariable,
            price,
            discountPrice,
            stock,
            variations,
            netWeight,
            length,
            width,
            height
        } = req.body;

        let category = Array.isArray(req.body.category) ? req.body.category : [req.body.category];

        // ✅ STEP 1: Clean slug
        const cleanedSlug = slug
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        // ✅ STEP 2: Validate store
        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" });
        }
        if (findStore.status.includes("Inactive")) {
            return res.status(403).json({
                message: "Your Store Has Been Deactivated By Admin, Contact Admin To Enable Your Store"
            });
        }

        // ✅ STEP 3: Validate slug uniqueness BEFORE uploading
        const findProduct = await ProductModel.findOne({ slug: cleanedSlug });
        if (findProduct) {
            return res.status(404).json({
                message: "Product Already Exists, Title And Slug Should Be Unique"
            });
        }

        // ✅ STEP 4: Validate default category BEFORE uploading
        const findDefaultCategory = await CategoryModel.findOne({ name: "uncategorized" });
        if (!findDefaultCategory) {
            return res.status(404).json({
                message: "Default Category Doesn't Exist. Please Select Any Category"
            });
        }

        // ✅ STEP 5: Validate isVariable / variations BEFORE uploading
        let parsedVariations = null;
        const isVariableBool = isVariable === true || isVariable === 'true';
        const isVariableFalse = isVariable === false || isVariable === 'false';

        if (isVariableFalse) {
            if (price === undefined || stock === undefined) {
                return res.status(400).json({ message: "price and stock are required for non-variable products" });
            }
        } else if (isVariableBool) {
            try {
                parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
            } catch (e) {
                return res.status(400).json({ message: "Invalid variations JSON" });
            }
        } else {
            return res.status(400).json({ message: "Invalid value for isVariable" });
        }

        // ✅ STEP 6: NOW upload to Cloudinary (only after all validation passed)
        const productImage = req?.files?.productImage;
        const uploadResult = productImage
            ? await cloudinary.uploader.upload(productImage.tempFilePath, {
                resource_type: 'image',
                folder: `${findStore.storeName} products`,
            })
            : { secure_url: '' };

        const galleryImages = req?.files?.galleryImages;
        const imageUrls = [];

        if (Array.isArray(galleryImages)) {
            for (const image of galleryImages) {
                const galleryUploadResult = await cloudinary.uploader.upload(image?.tempFilePath);
                imageUrls.push(galleryUploadResult.secure_url);
            }
        } else if (galleryImages) {
            const galleryUploadResult = await cloudinary.uploader.upload(galleryImages?.tempFilePath);
            imageUrls.push(galleryUploadResult.secure_url);
        }

        // ✅ STEP 7: Create product
        const createProduct = new ProductModel({
            storeID,
            title,
            desc,
            slug: cleanedSlug,
            isVariable,
            category: (Array.isArray(category) && category.length === 0) || category == null
                ? [findDefaultCategory._id]
                : category,
            productImage: uploadResult.secure_url || 'https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps',
            galleryImages: imageUrls.length > 0
                ? imageUrls
                : ['https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps'],
            netWeight,
            length,
            width,
            height
        });

        if (isVariableFalse) {
            createProduct.price = price;
            createProduct.discountPrice = discountPrice;
            createProduct.stock = stock;
        } else {
            createProduct.variations = parsedVariations;
        }

        await createProduct.save();

        return res.status(200).json({ message: "Product Created Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @PATCH
// /api/products/:storeID/update-product/:productID
const HandleUpdateProduct = async (req, res) => {
    try {
        const { storeID, productID } = req.params;
        const {
            title,
            desc,
            slug,
            isVariable,
            price,
            discountPrice,
            stock,
            variations,
            netWeight,
            length,
            width,
            height
        } = req.body;

        let category = Array.isArray(req.body.category) ? req.body.category : [req.body.category];

        // ✅ STEP 1: Clean slug
        const cleanedSlug = slug
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        // ✅ STEP 2: Validate store + product first
        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" });
        }
        if (findStore.status.includes("Inactive")) {
            return res.status(403).json({
                message: "Your Store Has Been Deactivated By Admin, Contact Admin To Enable Your Store"
            });
        }

        const product = await ProductModel.findById(productID);
        if (!product) {
            return res.status(404).json({ message: "Product Not Found" });
        }

        // ✅ STEP 3: Validate slug uniqueness BEFORE uploading
        const findProduct = await ProductModel.findOne({
            slug: cleanedSlug,
            _id: { $ne: productID }
        });
        if (findProduct) {
            return res.status(404).json({
                message: "Another product with the same title or slug already exists"
            });
        }

        // ✅ STEP 4: Validate category + isVariable BEFORE uploading
        const findDefaultCategory = await CategoryModel.findOne({ name: "uncategorized" });
        if (!findDefaultCategory) {
            return res.status(404).json({
                message: "Default Category Doesn't Exist. Please Select Any Category"
            });
        }

        let parsedVariations = product.variations;
        const isVariableBool = isVariable === true || isVariable === 'true';
        const isVariableFalse = isVariable === false || isVariable === 'false';

        if (isVariableBool) {
            try {
                parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
            } catch (e) {
                return res.status(400).json({ message: "Invalid variations JSON" });
            }
        }

        // ✅ STEP 5: NOW upload to Cloudinary
        const productImage = req?.files?.productImage;
        const uploadResult = productImage
            ? await cloudinary.uploader.upload(productImage.tempFilePath, {
                resource_type: 'image',
                folder: `${findStore.storeName} products`,
            })
            : null; // null means "keep existing"

        const galleryImages = req?.files?.galleryImages;
        const imageUrls = [];

        if (Array.isArray(galleryImages)) {
            for (const image of galleryImages) {
                const galleryUploadResult = await cloudinary.uploader.upload(image?.tempFilePath);
                imageUrls.push(galleryUploadResult.secure_url);
            }
        } else if (galleryImages) {
            const galleryUploadResult = await cloudinary.uploader.upload(galleryImages?.tempFilePath);
            imageUrls.push(galleryUploadResult.secure_url);
        }

        // ✅ STEP 6: Apply updates
        product.title = title || product.title;
        product.desc = desc || product.desc;
        product.slug = cleanedSlug || product.slug;
        product.isVariable = isVariable ?? product.isVariable;
        product.category = category;
        product.productImage = uploadResult?.secure_url || product.productImage;
        product.galleryImages = imageUrls.length === 0 ? product.galleryImages : imageUrls;
        product.netWeight = netWeight || product.netWeight;
        product.length = length || product.length;
        product.width = width || product.width;
        product.height = height || product.height;

        if (isVariableFalse) {
            product.price = price || product.price;
            product.discountPrice = discountPrice || product.discountPrice;
            product.stock = stock || product.stock;
        } else if (isVariableBool) {
            product.variations = parsedVariations;
        } else {
            return res.status(400).json({ message: "Invalid value for isVariable" });
        }

        await product.save();
        return res.status(200).json({ message: "Product Updated Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @GET
// /api/products/get-products
// Query params: id (user/admin/storeOwner id), category, keyword, page, limit
const HandleGetProducts = async (req, res) => {
  try {
    const { category, keyword, id } = req.query;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Determine user role from provided id
    let isAdmin = false;
    let isStoreOwner = false;
    let userId = null;

    if (id) {
      const user = await User.findById(id);
      const storeOwner = await StoreOwnerModel.findById(id);
      const admin = await AdminModel.findById(id);

      if (admin) {
        isAdmin = true;
        userId = id;
      } else if (storeOwner) {
        isStoreOwner = true;
        userId = id;
      } else if (user) {
        userId = id;
      }
    }

    const matchStage = { status: 'Active' };

    if (category) {
      matchStage.category = {
        $in: Array.isArray(category) ? category : [category],
      };
    }

    if (keyword) {
      matchStage.title = { $regex: keyword, $options: 'i' };
    }

    // StoreOwner only sees their own products
    if (isStoreOwner) {
      matchStage.storeID = new ProductModel.base.Types.ObjectId(userId);
    }

    // For regular users (not admin, not storeOwner), only show products from Open stores
    const enforceOpenStore = !isAdmin && !isStoreOwner;

    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'storeowners',
          localField: 'storeID',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },

      // Filter by storeStatus = 'Open' for regular users
      // storeStatus is an array ['Open'] or ['Close'] - use $in to check
      ...(enforceOpenStore
        ? [{ $match: { 'store.storeStatus': { $in: ['Open'] } } }]
        : []),

      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          storeID: {
            _id: '$store._id',
            name: '$store.storeName',
            storeStatus: '$store.storeStatus',
            email: '$store.email',
          },
        },
      },
      { $project: { store: 0 } },

      {
        $facet: {
          products: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await ProductModel.aggregate(pipeline);
    const products = result[0]?.products || [];
    const totalProducts = result[0]?.totalCount?.[0]?.count || 0;

    res.status(200).json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      totalProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @DELETE
///api/products/:storeID/delete-products/:prodID
const HandleDeleteProduct = async (req, res) => {
    try {
        const { productID, storeID } = req.params;

        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Invalid Request" })
        }
        const product = await ProductModel.findOneAndDelete({ _id: productID, storeID });
        if (!product) {
            return res.status(400).json({ message: "Some Error Occured While Deleting Product" })
        }
        res.status(200).json({ message: "Product Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET
// /api/products/best-sellers
// Query params: limit, id (user id for role-based filtering)
const HandleGetBestSellers = async (req, res) => {
    try {
        const { limit = 10, id } = req.query;

        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({ message: 'Invalid limit parameter. It must be a positive integer.' });
        }

        // Determine user role from provided id
        let isAdmin = false;
        let isStoreOwner = false;

        if (id) {
            const user = await User.findById(id);
            const storeOwner = await StoreOwnerModel.findById(id);
            const admin = await AdminModel.findById(id);

            if (admin) {
                isAdmin = true;
            } else if (storeOwner) {
                isStoreOwner = true;
            }
        }

        // For regular users (not admin, not storeOwner), only show products from Open stores
        const enforceOpenStore = !isAdmin && !isStoreOwner;

        const pipeline = [
            { $match: { status: 'Active' } },

            {
                $lookup: {
                    from: 'storeowners',
                    localField: 'storeID',
                    foreignField: '_id',
                    as: 'store',
                },
            },
            { $unwind: '$store' },

            // Filter by storeStatus = 'Open' for regular users
            ...(enforceOpenStore
                ? [{ $match: { 'store.storeStatus': { $in: ['Open'] } } }]
                : []),

            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Sort by salesCount descending and limit
            { $sort: { salesCount: -1 } },
            { $limit: parsedLimit },
        ];

        const bestSellers = await ProductModel.aggregate(pipeline);

        if (bestSellers.length === 0) {
            return res.status(404).json({ message: 'No best-selling products found.' });
        }

        res.status(200).json(bestSellers);

    } catch (error) {
        console.error('Error fetching best sellers:', error);
        if (error.name === 'MongoError') {
            return res.status(500).json({ message: 'Database error occurred', error });
        }
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// @GET
// /api/products/get-product/:productId
// Returns single product details (no role-based filtering)
const HandleGetSingleProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const product = await ProductModel.findById(productId)
            .populate('category', 'name')
            .populate('storeID', 'storeName storeStatus email');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);

    } catch (error) {
        console.error('Error fetching single product:', error);
        if (error.name === 'MongoError') {
            return res.status(500).json({ message: 'Database error occurred', error });
        }
        res.status(500).json({ message: 'Internal server error', error });
    }
};


export {
    HandleCreateProduct,
    HandleUpdateProduct,
    HandleGetProducts,
    HandleDeleteProduct,
    HandleGetBestSellers,
    HandleGetSingleProduct
}