
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
        } = req.body

        let category = Array.isArray(req.body.category) ? req.body.category : [req.body.category];
        console.log(category, "category");


        const cleanedSlug = slug.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" });
        }

        if (findStore.status.includes("Inactive")) {
            return res.status(403).json({ message: "Your Store Has Been Deactivated By Admin, Contact Admin To Enable Your Store" });
        }

        const productImage = req?.files?.productImage;
        const uploadResult = productImage ? await cloudinary.uploader.upload(productImage.tempFilePath, {
            resource_type: 'image',
            folder: `${findStore.storeName} products`,
        }) : '';

        const galleryImages = req?.files?.galleryImages;
        const imageUrls = [];

        console.log(imageUrls, galleryImages, productImage, uploadResult)

        if (Array.isArray(galleryImages)) {
            for (const image of galleryImages) {
                const galleryUploadResult = await cloudinary.uploader.upload(image?.tempFilePath);
                imageUrls.push(galleryUploadResult.secure_url);
            }
        } else if (galleryImages) {
            const galleryUploadResult = await cloudinary.uploader.upload(galleryImages?.tempFilePath);
            imageUrls.push(galleryUploadResult.secure_url);
        }

        const findProduct = await ProductModel.findOne({
            $or: [
                { slug: cleanedSlug }
            ]
        });

        if (findProduct) {
            return res.status(404).json({ message: "Product Already Exists, Title And Slug Should Be Unique" });
        }

        const findDefaultCategory = await CategoryModel.findOne({ name: "uncategorized" });


        if (!findDefaultCategory) {
            return res.status(404).json({ message: "Default Category Doesn't Exist. Please Select Any Category" });
        }

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
            galleryImages: imageUrls.length > 0 ? imageUrls : ['https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps'],
            netWeight,
            length,
            width,
            height
        });

        if (isVariable === false || isVariable === 'false') {
            createProduct.price = price;
            createProduct.discountPrice = discountPrice;
            createProduct.stock = stock;
        } else if (isVariable === true || isVariable === 'true') {
            createProduct.variations = typeof variations === 'string' ? JSON.parse(variations) : variations;
        } else {
            return res.status(400).json({ message: "Invalid value for isVariable" });
        }

        await createProduct.save();

        return res.status(200).json({ message: "Product Created Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

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

        console.log("categorgdhfghy", category);

        const cleanedSlug = slug.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" });
        }

        if (findStore.status.includes("Inactive")) {
            return res.status(403).json({ message: "Your Store Has Been Deactivated By Admin, Contact Admin To Enable Your Store" });
        }

        const product = await ProductModel.findById(productID);
        if (!product) {
            return res.status(404).json({ message: "Product Not Found" });
        }

        const productImage = req?.files?.productImage;

        const uploadResult = productImage ? await cloudinary.uploader.upload(productImage.tempFilePath, {
            resource_type: 'image',
            folder: `${findStore.storeName} products`,
        }) : product.productImage;

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

        const findProduct = await ProductModel.findOne({
            $or: [
                { slug: cleanedSlug }
            ],
            _id: { $ne: productID }
        });

        if (findProduct) {
            return res.status(404).json({ message: "Another product with the same title or slug already exists" });
        }

        const findDefaultCategory = await CategoryModel.findOne({ name: "uncategorized" });

        if (!findDefaultCategory) {
            return res.status(404).json({ message: "Default Category Doesn't Exist. Please Select Any Category" });
        }
        product.title = title || product.title;
        product.desc = desc || product.desc;
        product.slug = cleanedSlug || product.slug;
        product.isVariable = isVariable || product.isVariable;
        product.category = category;
        product.productImage = uploadResult.secure_url || product.productImage;
        product.galleryImages = imageUrls.length === 0 ? product.galleryImages : imageUrls;
        product.netWeight = netWeight || product.netWeight;
        product.length = length || product.length;
        product.width = width || product.width;
        product.height = height || product.height;

        if (isVariable === false || isVariable === 'false') {
            product.price = price || product.price;
            product.discountPrice = discountPrice || product.discountPrice;
            product.stock = stock || product.stock;
        } else if (isVariable === true || isVariable === 'true') {
            product.variations = typeof variations === 'string' ? JSON.parse(variations) : variations;
        } else {
            return res.status(400).json({ message: "Invalid value for isVariable" });
        }

        await product.save();
        return res.status(200).json({ message: "Product Updated Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET
// /api/products/get-products?id={cookieID}&category={categoryId}&keyword={search}&limit={limit}&count={count}
// const HandleGetProducts = async (req, res) => {
//     try {
//         const { category, keyword, id } = req.query;
//         const { page = 1, limit = 10 } = req.query;

//         const findUser = await User.findById(id) || await StoreOwnerModel.findById(id) || await AdminModel.findById(id);

//         const findStores = await StoreOwnerModel.find({ status: ['Active'] })

//         const extractStoreIDs = findStores.map((store) => store._id.toString())

//         if (page <= 0 || limit <= 0) {
//             return res.status(400).json({ message: "Invalid page or limit" });
//         }

//         let products;

//         if (findUser) {
//             if (findUser.role.includes("StoreOwner")) {
//                 if (category && keyword) {
//                     products = await ProductModel.find({ storeID: id, category: { $in: category }, title: { $regex: keyword, $options: 'i' } }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (!category && keyword) {
//                     products = await ProductModel.find({ storeID: id, title: { $regex: keyword, $options: 'i' } }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (category && !keyword) {
//                     products = await ProductModel.find({ storeID: id, category: { $in: category } }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else {
//                     products = await ProductModel.find({ storeID: id }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 }
//                 const totalPages = await ProductModel.countDocuments({ storeID: id }).exec();
//                 return res.status(200).json({
//                     products: products,
//                     totalPages: Math.ceil(totalPages / limit),
//                     currentPage: Number(page),
//                 })

//             } else if (findUser.role.includes("Admin")) {

//                 if (category && keyword) {
//                     products = await ProductModel.find({ category: { $in: category }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (!category && keyword) {
//                     products = await ProductModel.find({ title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (category && !keyword) {
//                     products = await ProductModel.find({ category: { $in: category }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else {
//                     products = await ProductModel.find({ status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 }
//                 const totalPages = await ProductModel.countDocuments({ status: ['Active'] }).exec(); return res.status(200).json({
//                     products: products,
//                     totalPages: Math.ceil(totalPages / limit),
//                     currentPage: Number(page),
//                 })

//             } else if (findUser.role.includes("User")) {
//                 const findStores = await StoreOwnerModel.find({ status: ['Active'] })
//                 const extractStoreIDs = findStores.map((store) => store._id.toString())

//                 if (category && keyword) {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, category: { $in: category }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (!category && keyword) {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (category && !keyword) {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, category: { $in: category }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 }
//                 const totalPages = await ProductModel.countDocuments({ storeID: { $in: extractStoreIDs }, status: ['Active'] }).exec();
//                 return res.status(200).json({
//                     products: products,
//                     totalPages: Math.ceil(totalPages / limit),
//                     currentPage: Number(page),
//                 })
//             } else {
//                 if (category && keyword) {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, category: { $in: category }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (!category && keyword) {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else if (category && !keyword) {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, category: { $in: category }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 } else {
//                     products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, status: ['Active'] }).populate({
//                         path: 'category',
//                         model: "categories",
//                         select: ""
//                     }).populate({
//                         path: 'storeID',
//                         model: 'StoreOwner',
//                         select: '-password'
//                     }).limit(limit * 1)
//                         .skip((page - 1) * limit)
//                         .exec();
//                 }
//                 const totalPages = await ProductModel.countDocuments({ storeID: { $in: extractStoreIDs }, status: ['Active'] }).exec();
//                 return res.status(200).json({
//                     products: products,
//                     totalPages: Math.ceil(totalPages / limit),
//                     currentPage: Number(page),
//                 })

//             }
//         } else {
//             if (category && keyword) {
//                 products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, category: { $in: category }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                     path: 'category',
//                     model: "categories",
//                     select: ""
//                 }).populate({
//                     path: 'storeID',
//                     model: 'StoreOwner',
//                     select: '-password'
//                 }).limit(limit * 1)
//                     .skip((page - 1) * limit)
//                     .exec();
//             } else if (!category && keyword) {
//                 products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, title: { $regex: keyword, $options: 'i' }, status: ['Active'] }).populate({
//                     path: 'category',
//                     model: "categories",
//                     select: ""
//                 }).populate({
//                     path: 'storeID',
//                     model: 'StoreOwner',
//                     select: '-password'
//                 }).limit(limit * 1)
//                     .skip((page - 1) * limit)
//                     .exec();
//             } else if (category && !keyword) {
//                 products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, category: { $in: category }, status: ['Active'] }).populate({
//                     path: 'category',
//                     model: "categories",
//                     select: ""
//                 }).populate({
//                     path: 'storeID',
//                     model: 'StoreOwner',
//                     select: '-password'
//                 }).limit(limit * 1)
//                     .skip((page - 1) * limit)
//                     .exec();
//             } else {
//                 products = await ProductModel.find({ storeID: { $in: extractStoreIDs }, status: ['Active'] }).populate({
//                     path: 'category',
//                     model: "categories",
//                     select: ""
//                 }).populate({
//                     path: 'storeID',
//                     model: 'StoreOwner',
//                     select: '-password'
//                 }).limit(limit * 1)
//                     .skip((page - 1) * limit)
//                     .exec();
//             }
//             const totalPages = await ProductModel.countDocuments({ storeID: { $in: extractStoreIDs }, status: ['Active'] }).exec();
//             return res.status(200).json({
//                 products: products,
//                 totalPages: Math.ceil(totalPages / limit),
//                 currentPage: Number(page),
//             })
//         }
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

const HandleGetProducts = async (req, res) => {
    try {
        const { category, keyword, id } = req.query;
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const findUser = await User.findById(id) || await StoreOwnerModel.findById(id) || await AdminModel.findById(id);

        const findStores = await StoreOwnerModel.find({ status: 'Active' });
        const extractStoreIDs = findStores.map(store => store._id.toString());

        let filter = { status: 'Active' };

        // Apply category filter
        if (category) filter.category = { $in: Array.isArray(category) ? category : [category] };

        // Apply store filter
        if (findUser && findUser.role.includes('StoreOwner')) filter.storeID = id;
        else filter.storeID = { $in: extractStoreIDs };

        // Apply keyword filter
        if (keyword) filter.title = { $regex: keyword, $options: 'i' };

        // Get total count for pagination
        const totalProducts = await ProductModel.countDocuments(filter);

        // Fetch paginated products
        const products = await ProductModel.find(filter)
            .populate({ path: 'category', model: 'categories' })
            .populate({ path: 'storeID', model: 'StoreOwner', select: '-password' })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        res.status(200).json({
            products,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            totalProducts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
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

const HandleGetBestSellers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({ message: 'Invalid limit parameter. It must be a positive integer.' });
        }

        const bestSellers = await ProductModel.find({ status: 'Active' })
            .populate({
                path: 'category',
                model: 'categories',
            })
            .populate({
                path: 'storeID',
                model: 'StoreOwner',
                select: '-password',
            })
            .exec();

        if (bestSellers.length === 0) {
            return res.status(404).json({ message: 'No best-selling products found.' });
        }

        if (bestSellers.length > parsedLimit) {
            bestSellers.sort((a, b) => b.salesCount - a.salesCount);
        }

        const result = bestSellers.slice(0, parsedLimit);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching best sellers:', error);
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
    HandleGetBestSellers
}