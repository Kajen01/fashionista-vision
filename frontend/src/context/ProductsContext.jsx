import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from "axios";

export const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [mongodbProducts, setMongodbProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredProductsMongodb, setFilteredProductsMongodb] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermMongodb, setSearchTermMongodb] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Initialize with sample products
    const sampleProducts = [
      // Dresses (20 items)
      { id: 1, name: "Elegant Evening Gown", category: "dresses", price: 5500, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/women-club.online/b807bb5f7fa124ce3016ec5d03eaff623ad7bbdd.jpg", description: "Stunning evening gown perfect for special occasions" },
      { id: 2, name: "Bohemian Maxi Dress", category: "dresses", price: 5000, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/img-va.myshopline.com/f7de2be0bfd749b4f2245fa55e28a9aaf2fd9dd2.jpg", description: "Flowing bohemian style maxi dress" },
      { id: 3, name: "Classic Wrap Dress", category: "dresses", price: 6000, discount: 16, image: "https://kimi-web-img.moonshot.cn/img/cdn.shopify.com/c25fd7b186dcf36c30c782fb78ff5c47da546b8c.jpg", description: "Timeless wrap dress that flatters every figure" },
      { id: 4, name: "Minimalist Slip Dress", category: "dresses", price: 6500, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/www.fashiongonerogue.com/6280f1fa7e47b759494fcc5242218684a2185e48.jpg", description: "Clean and minimal slip dress" },
      { id: 5, name: "Office Midi Dress", category: "dresses", price: 6600, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/photos.starshiners.com/3019b7c770143e9aa3c042204ca8a2dc9fb56a15.jpg", description: "Professional midi dress for the office" },
      { id: 6, name: "Cocktail Party Dress", category: "dresses", price: 7500, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/c1bca43646d89cc786f6296519ec1b554f03b27b.jpg", description: "Perfect dress for cocktail parties" },
      { id: 7, name: "Summer Sundress", category: "dresses", price: 5200, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/i5.walmartimages.com/d6e529b41c6d3e415e4a604ec40b13591c6e358e.jpeg", description: "Light and breezy summer sundress" },
      { id: 8, name: "Formal Prom Dress", category: "dresses", price: 5600, discount: 15, image: "https://kimi-web-img.moonshot.cn/img/clarisse.com/c7597f93039f1796c2524e8d23b0b29c86e17639.jpg", description: "Elegant prom dress for special occasions" },
      { id: 9, name: "Wedding Guest Dress", category: "dresses", price: 5800, discount: 13, image: "https://kimi-web-img.moonshot.cn/img/weddingdressesguide.com/be2eab0dab387cf29da1b2095a4776839eda05d3.jpg", description: "Perfect dress for wedding guests" },
      { id: 10, name: "A-Line Classic Dress", category: "dresses", price: 5600, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/cdn.cliqueinc.com/69c63837de5e945115bf7d4f4b12318e667a229b.jpg", description: "Classic A-line dress for any occasion" },
      { id: 11, name: "Trendy Mini Dress", category: "dresses", price: 6000, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/www.bintiboutique.com.au/c77de9d48530cb7f7ee1cb6815d362e8b0980fe3.jpg", description: "Fashion-forward mini dress" },
      { id: 12, name: "Casual Shirt Dress", category: "dresses", price: 6500, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/9e5a67db8491d1aa51387dee0678a285bc041514.jpg", description: "Comfortable casual shirt dress" },
      { id: 13, name: "Bodycon Club Dress", category: "dresses", price: 6800, discount: 16, image: "https://kimi-web-img.moonshot.cn/img/cdn.cliqueinc.com/bb3f591c5722172ad9272efd544c3281450ab40c.jpg", description: "Sexy bodycon dress for nights out" },
      { id: 14, name: "Elegant Evening Dress", category: "dresses", price: 5600, discount: 16, image: "https://kimi-web-img.moonshot.cn/img/www.alamodelabel.in/00d3e8264220d1d9dd057062805183fd4605679d.jpg", description: "Sophisticated evening dress" },
      { id: 15, name: "Casual Summer Dress", category: "dresses", price: 5400, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/cdn.cliqueinc.com/9e0807207821a7723b7d85c0a0e45c851c7e8e80.jpg", description: "Perfect casual dress for summer" },
      { id: 16, name: "Bohemian Maxi Dress", category: "dresses", price: 6200, discount: 19, image: "https://kimi-web-img.moonshot.cn/img/www.ibizabohogirl.com/9e4c1ea744c2693983afddb73604507e5fd5d107.jpg", description: "Beautiful bohemian maxi dress" },
      { id: 17, name: "Prom Formal Dress", category: "dresses", price: 7800, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/thewowstyle.com/41fe89edc0b30e3fa37ae7767cae61827d476cb3.jpg", description: "Stunning formal prom dress" },
      { id: 18, name: "Minimalist Slip Dress", category: "dresses", price: 8000, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/cdn.stillwhite.com/db3c5085e42d5afb82a3d2316b7072139c411172.jpg", description: "Simple and elegant slip dress" },
      { id: 19, name: "Summer Casual Dress", category: "dresses", price: 7400, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/www.fashionacy.com/5f157b4ebbf821364d78cf6ab2b0dbc6c8b1c69b.jpg", description: "Light casual summer dress" },
      { id: 20, name: "Wedding Guest Dress", category: "dresses", price: 5900, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/www.weddingforward.com/b892d9d54b39cf64faeefddc84dd57cae9b3aeab.jpg", description: "Elegant dress for wedding guests" },

      // Tops (15 items)
      { id: 21, name: "Elegant Silk Blouse", category: "tops", price: 7400, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/au.lewkin.com/b03f68a3d9daaee2d26eda305947dc58eb058f1b.jpg", description: "Luxurious silk blouse for office wear" },
      { id: 22, name: "Casual Cotton Shirt", category: "tops", price: 5500, discount: 16, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/bbddeb0fd345cf63bdaf6d17f4ba1dd6c3f25e28.jpg", description: "Comfortable cotton shirt for everyday wear" },
      { id: 23, name: "Cozy Knit Sweater", category: "tops", price: 5400, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/32728a4547855ab6e739a716d984161782dad7b5.jpg", description: "Warm and cozy knit sweater" },
      { id: 24, name: "Professional Blazer", category: "tops", price: 6000, discount: 14, image: "https://kimi-web-img.moonshot.cn/img/www.savemari.com/ebfe15fb8fd4e8760445e48bf7ddb061d1fe0873.jpg", description: "Professional blazer for business meetings" },
      { id: 25, name: "Activewear Top", category: "tops", price: 6100, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/umbrasports.com/d175d715dcc95bc0fd0301a6b845616d9c1531bf.jpg", description: "Breathable activewear top for workouts" },
      { id: 26, name: "Elegant Blouse", category: "tops", price: 6300, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/asset1.cxnmarksandspencer.com/fee15453911c505213a6f72e3afab77aacf51e5f", description: "Elegant blouse for special occasions" },
      { id: 27, name: "Casual T-Shirt", category: "tops", price: 5400, discount: 12, image: "https://kimi-web-img.moonshot.cn/img/asset1.cxnmarksandspencer.com/341312b892cac225543db6a1195b57ef69e1dd9a", description: "Basic casual t-shirt" },
      { id: 28, name: "Evening Top", category: "tops", price: 7600, discount: 16, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/4f5a9ac2c471b5d24956a59b29fda3f84911fffc.jpg", description: "Glamorous evening top" },
      { id: 29, name: "Summer Blouse", category: "tops", price: 6000, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/19676b6df99179bad00ec53ee978eea02e3663f3.jpg", description: "Light summer blouse" },
      { id: 30, name: "Formal Shirt", category: "tops", price: 7600, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/image.made-in-china.com/8c3c5812f2ae105baa42d197713eb6014bec53a8.jpg", description: "Classic formal shirt" },

      // Bottoms (15 items)
      { id: 31, name: "High-Waist Jeans", category: "bottoms", price: 6400, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/4f5a9ac2c471b5d24956a59b29fda3f84911fffc.jpg", description: "Flattering high-waist jeans" },
      { id: 32, name: "Midi Skirt", category: "bottoms", price: 6000, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/images.fcwholesale.com/143f1992ade453571ff88d27a4afd5bda1f7f1ea.jpg", description: "Elegant midi skirt for any occasion" },
      { id: 33, name: "Denim Shorts", category: "bottoms", price: 7400, discount: 14, image: "https://kimi-web-img.moonshot.cn/img/lewkin.com/30cbf8d7a1f1871e15e5074a478d9e563efe8305.jpg", description: "Classic denim shorts for summer" },
      { id: 34, name: "Wide Leg Pants", category: "bottoms", price: 7600, discount: 12, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/0e58f9e3bf7ac44cf30b05f2da6ed49fcdb3b14a.jpg", description: "Trendy wide leg pants" },
      { id: 35, name: "Pleated Skirt", category: "bottoms", price: 5400, discount: 13, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/33f4bbee306e5b6ca7b0f5588db82846de6e4aaf.jpg", description: "Classic pleated skirt" },
      { id: 36, name: "Skinny Jeans", category: "bottoms", price: 6500, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/7ba04ff5d84484b771bc3c5984fc3662889e8846.jpg", description: "Perfect fit skinny jeans" },
      { id: 37, name: "Mini Skirt", category: "bottoms", price: 7600, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/0dad6b70eff004014f359a0cd41530daa4ba8a83.jpg", description: "Stylish mini skirt" },
      { id: 38, name: "Palazzo Pants", category: "bottoms", price: 6000, discount: 15, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/7ed63b014a9c95221756cca51e23accc629af9fe.jpg", description: "Flowing palazzo pants" },
      { id: 39, name: "A-Line Skirt", category: "bottoms", price: 7000, discount: 19, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/f23427d039159944ccad652e0a1227e0fb11b1d6.jpg", description: "Classic A-line skirt" },
      { id: 40, name: "Straight Leg Jeans", category: "bottoms", price: 6500, discount: 14, image: "https://kimi-web-img.moonshot.cn/img/ae01.alicdn.com/34ea85510a1d5a0b0e6849714662d3a76cbe02c1.jpg", description: "Classic straight leg jeans" },

      // Accessories (10 items)
      { id: 41, name: "Designer Handbag", category: "accessories", price: 6500, discount: 19, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/f94ae16e315648b4dfecc1e7b7d54fd3e549bb2a.jpg", description: "Luxurious designer handbag" },
      { id: 42, name: "Gold Necklace Set", category: "accessories", price: 7600, discount: 11, image: "https://kimi-web-img.moonshot.cn/img/www.jewelsing.com/6aa50373a18cb866086402c3d6c0a10e6e784ace.jpg", description: "Elegant gold necklace set" },
      { id: 43, name: "Leather Boots", category: "accessories", price: 5400, discount: 14, image: "https://kimi-web-img.moonshot.cn/img/i5.walmartimages.com/c0a1abafdb74414792a0b9938280608cccd307a5.jpeg", description: "Premium leather boots" },
      { id: 44, name: "Silk Scarf", category: "accessories", price: 6000, discount: 12, image: "https://kimi-web-img.moonshot.cn/img/fishersfinery.com/65d7ff8bf53c4af5c348405e634061e79356b04d.jpg", description: "Luxurious silk scarf" },
      { id: 45, name: "Statement Earrings", category: "accessories", price: 7500, discount: 16, image: "https://kimi-web-img.moonshot.cn/img/g03.a.alicdn.com/e009168535aeb3b9b71fa41498ed4a51f3c4919e.jpg", description: "Bold statement earrings" },
      { id: 46, name: "Crossbody Bag", category: "accessories", price: 5400, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/8098a14897a8d87c59d3a11d7792c3435aa2d15e.jpg", description: "Stylish crossbody bag" },
      { id: 47, name: "High Heel Sandals", category: "accessories", price: 7600, discount: 18, image: "https://kimi-web-img.moonshot.cn/img/www.gothicplus.com/c2e7fff5c07ab50b1d3a9e8e11506498b62159cd.webp", description: "Elegant high heel sandals" },
      { id: 48, name: "Cashmere Scarf", category: "accessories", price: 6400, discount: 15, image: "https://kimi-web-img.moonshot.cn/img/images.quince.com/1e7a3d1901f0a6697b5851d8b19605690a1ebdee.jpg", description: "Soft cashmere scarf" },
      { id: 49, name: "Evening Clutch", category: "accessories", price: 5400, discount: 12, image: "https://kimi-web-img.moonshot.cn/img/www.stylishtrendy.com/44d0a583f899b0b62d403c280ade4342a07cd4a3.jpg", description: "Elegant evening clutch" },
      { id: 50, name: "Ankle Boots", category: "accessories", price: 7400, discount: 20, image: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/2e37f432cb4913f97f678abce7edbbc09ec81a66.jpg", description: "Stylish ankle boots" }
    ];
    
    const defaultSizes = ["Free Size", "XS", "S", "M", "L", "XL"];
    const defaultColors  = ["Black", "White", "Navy", "Beige"];

    const enhancedProducts = sampleProducts.map(p => ({
      ...p,
      availableSizes: defaultSizes,
      availableColors: defaultColors
    }));

    setProducts(enhancedProducts);
    setFilteredProducts(enhancedProducts);
  }, []);
  
  // Get from MongoDB
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setMongodbProducts(res.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    let filtered = mongodbProducts;

    if (searchTermMongodb) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTermMongodb.toLowerCase())
      );
    }

    setFilteredProductsMongodb(filtered);
  }, [searchTermMongodb]);

  const filterByCategory = (category) => {
    setSelectedCategory(category);
  };

  const filterBySearch = (term) => {
    setSearchTerm(term);
  };

  const filterBySearchMongodb = (term) => {
    const lowerTerm = term.toLowerCase();

    const filtered = mongodbProducts.filter(product =>
      product.name.toLowerCase().includes(lowerTerm)
    );
    
    setFilteredProductsMongodb(filtered);
    return filtered
  };

  const getProductsByCategory = (category) => {
    return products.filter(product => product.category === category);
  };

  const getRandomProducts = (count) => {
    return [...products].sort(() => Math.random() - 0.5).slice(0, count);
  };

  const getRandomProductsModel = (count) => {
    return [...mongodbProducts].sort(() => Math.random() - 0.5).slice(0, count);
  };

  const value = {
    products,
    mongodbProducts,
    filteredProducts,
    filteredProductsMongodb,
    searchTerm,
    searchTermMongodb,
    selectedCategory,
    filterByCategory,
    filterBySearch,
    filterBySearchMongodb,
    getProductsByCategory,
    getRandomProducts,
    getRandomProductsModel
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = () => {
  const { products, filteredProducts, searchTerm, selectedCategory, filterByCategory, filterBySearch, getProductsByCategory, getRandomProducts } = useContext(ProductsContext);
  if (!products) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return {
    products,
    filteredProducts,
    searchTerm,
    selectedCategory,
    filterByCategory,
    filterBySearch,
    getProductsByCategory,
    getRandomProducts,
  };
};

export const useProductsModel = () => {
  const { mongodbProducts, filteredProductsMongodb, searchTermMongodb, getRandomProductsModel, filterBySearchMongodb } = useContext(ProductsContext);
  if (!mongodbProducts) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return {
    mongodbProducts,
    filteredProductsMongodb,
    searchTermMongodb,
    getRandomProductsModel,
    filterBySearchMongodb
  };
};