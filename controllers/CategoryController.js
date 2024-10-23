
import { v2 as cloudinary } from "cloudinary";
import AdminModel from "../models/AdminModel.js";
import CategoryModel from "../models/CategoryModel.js";
import ProductModel from "../models/ProductModel.js";


// @POST
// /api/category/create-category/:adminID
const HandleCreateCategory = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { name, slug, status } = req.body;

        const findAdmin = await AdminModel.findById(adminID);
        if (!findAdmin) {
            return res.status(404).json({ message: "Invalid Store ID" });
        }

        const isExist = await CategoryModel.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            slug: { $regex: new RegExp(`^${slug}$`, 'i') }
        });

        if (isExist) {
            return res.status(400).json({ message: "Category Already Exists!" })
        }
        const catImage = req?.files?.catImage;
        const uploadResult = catImage ? await cloudinary.uploader.upload(catImage.tempFilePath, {
            resource_type: 'image',
            folder: `category`,
        }) : '';

        const createCategory = new CategoryModel({
            adminID,
            name,
            slug: slug.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, ''),
            status,
            catImage: uploadResult.secure_url
        })
        await createCategory.save();
        res.status(201).json({ message: "Category created successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH
// /api/category/update-category/:adminID/:catID
const HandleUpdateCategory = async (req, res) => {
    try {

        const { adminID, catID } = req.params;
        const { name, slug, status } = req.body;

        const findAdmin = await AdminModel.findById(adminID);
        if (!findAdmin) {
            return res.status(404).json({ message: "Invalid Store ID" });
        }

        const findCategory = await CategoryModel.findById(catID);
        if (!findCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        const isExist = await CategoryModel.findOne({
            _id: { $ne: catID },
            $or: [
                {
                    name: { $regex: new RegExp(`^${name}$`, 'i') }
                },
                {
                    slug: { $regex: new RegExp(`^${slug}$`, 'i') }
                }
            ]

        });
        if (isExist) {
            return res.status(400).json({ message: "Category Already Exists!" })
        }

        const catImage = req?.files?.catImage;

        const uploadResult = catImage ? await cloudinary.uploader.upload(catImage.tempFilePath, {
            resource_type: 'image',
            folder: `category`,
        }) : findCategory.catImage;

        findCategory.name = name || findCategory.name
        findCategory.slug = slug.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') || findCategory.slug
        findCategory.status = status || findCategory.status
        findCategory.catImage = uploadResult.secure_url || findCategory.catImage

        await findCategory.save();
        res.status(200).json({ message: "Category updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET 
// /api/category/get-all-categories
const HandleGetCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const totalCount = await CategoryModel.countDocuments().exec();
        const findCategories = await CategoryModel.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        const addKey = await Promise.all(findCategories.map(async (item) => {
            const productCount = await ProductModel.countDocuments({ category: { $in: item._id } });
            return {
                ...item.toObject(),
                numberOfProducts: productCount
            };
        }));
        const totalPages = Math.ceil(totalCount / limit);
        res.status(200).json({ categories: addKey, totalPages, currentPage: Number(page) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @DELETE 
// /api/category/adminID/delete-category/catID
const HandleDeleteCategory = async (req, res) => {
    try {
        const { catID, adminID } = req.params;

        const findAdmin = await AdminModel.findById(adminID);
        if (!findAdmin) {
            return res.status(404).json({ message: "Invalid Request" });
        }

        const findCategory = await CategoryModel.findById(catID);
        if (!findCategory) {
            return res.status(404).json({ message: "Invalid Request" });
        }

        const findUncategorizedCat = await CategoryModel.findOne({ name: "uncategorized" });
        if (!findUncategorizedCat) {
            return res.status(404).json({ message: "Some Error Occurred While Deleting This Category" });
        }

        let opts = {
            runValidators: true,
            setDefaultsOnInsert: true,
            upsert: true,
            context: 'query'
        };

        // Corrected update operation
        const replaceProductCat = await ProductModel.updateMany(
            { category: { $in: [findCategory._id] } },
            { $set: { category: findUncategorizedCat._id } },
            opts
        );

        if (findCategory.name === "uncategorized") {
            return res.status(400).json({ message: "You cannot delete a default category" });
        }

        await CategoryModel.findByIdAndDelete(findCategory._id);

        return res.status(200).json({ message: "Category Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export {
    HandleCreateCategory,
    HandleUpdateCategory,
    HandleGetCategories,
    HandleDeleteCategory,
}