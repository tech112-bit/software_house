const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Productivity' },
      update: {},
      create: { name: 'Productivity' }
    }),
    prisma.category.upsert({
      where: { name: 'Design & Graphics' },
      update: {},
      create: { name: 'Design & Graphics' }
    }),
    prisma.category.upsert({
      where: { name: 'Development Tools' },
      update: {},
      create: { name: 'Development Tools' }
    }),
    prisma.category.upsert({
      where: { name: 'Security' },
      update: {},
      create: { name: 'Security' }
    }),
    prisma.category.upsert({
      where: { name: 'Business' },
      update: {},
      create: { name: 'Business' }
    })
  ]);

  // Create sample products
  const products = [
    {
      name: 'Office Pro Suite',
      description: 'Complete office productivity suite with word processing, spreadsheets, presentations, and more. Perfect for professionals and businesses.',
      shortDescription: 'Complete office productivity suite',
      price: 199.99,
      originalPrice: 299.99,
      images: JSON.stringify([
        '/images/office-pro-1.jpg',
        '/images/office-pro-2.jpg',
        '/images/office-pro-3.jpg'
      ]),
      features: JSON.stringify([
        'Word Processor with advanced formatting',
        'Spreadsheet with complex calculations',
        'Presentation software with templates',
        'Database management',
        'Email client integration',
        'Cloud sync across devices'
      ]),
      systemRequirements: JSON.stringify({
        os: 'Windows 10/11, macOS 10.15+',
        memory: '4GB RAM minimum, 8GB recommended',
        storage: '2GB available space',
        processor: 'Intel Core i3 or equivalent'
      }),
      fileSize: '1.2GB',
      version: '2024.1',
      categoryName: 'Productivity',
      isFeatured: true,
      stockCount: 1000,
      downloadLimit: 5
    },
    {
      name: 'PhotoEdit Master',
      description: 'Professional photo editing software with advanced tools for photographers and designers. Includes RAW processing, layers, filters, and more.',
      shortDescription: 'Professional photo editing software',
      price: 299.99,
      originalPrice: 399.99,
      images: JSON.stringify([
        '/images/photoedit-1.jpg',
        '/images/photoedit-2.jpg'
      ]),
      features: JSON.stringify([
        'RAW image processing',
        'Advanced layer system',
        'Professional filters and effects',
        'Batch processing',
        'Color correction tools',
        'HDR imaging support'
      ]),
      systemRequirements: JSON.stringify({
        os: 'Windows 10/11, macOS 10.15+',
        memory: '8GB RAM minimum, 16GB recommended',
        storage: '3GB available space',
        processor: 'Intel Core i5 or equivalent',
        graphics: 'DirectX 11 compatible'
      }),
      fileSize: '2.8GB',
      version: '7.2',
      categoryName: 'Design & Graphics',
      isFeatured: true,
      stockCount: 500,
      downloadLimit: 3
    },
    {
      name: 'CodeBuilder IDE',
      description: 'Integrated development environment for multiple programming languages. Features intelligent code completion, debugging tools, and project management.',
      shortDescription: 'Professional IDE for developers',
      price: 149.99,
      images: JSON.stringify([
        '/images/codebuilder-1.jpg',
        '/images/codebuilder-2.jpg',
        '/images/codebuilder-3.jpg'
      ]),
      features: JSON.stringify([
        'Multi-language support',
        'Intelligent code completion',
        'Advanced debugging tools',
        'Git integration',
        'Plugin ecosystem',
        'Project templates'
      ]),
      systemRequirements: JSON.stringify({
        os: 'Windows 10/11, macOS 10.15+, Linux',
        memory: '4GB RAM minimum, 8GB recommended',
        storage: '1.5GB available space',
        processor: 'Intel Core i3 or equivalent'
      }),
      fileSize: '950MB',
      version: '3.1',
      categoryName: 'Development Tools',
      stockCount: 750,
      downloadLimit: 5
    },
    {
      name: 'SecureVault Pro',
      description: 'Advanced password manager and digital vault. Keep your passwords, documents, and sensitive information secure with military-grade encryption.',
      shortDescription: 'Advanced password manager and digital vault',
      price: 49.99,
      originalPrice: 79.99,
      images: JSON.stringify([
        '/images/securevault-1.jpg',
        '/images/securevault-2.jpg'
      ]),
      features: JSON.stringify([
        'Military-grade encryption',
        'Password generator',
        'Secure document storage',
        'Two-factor authentication',
        'Cross-platform sync',
        'Secure sharing'
      ]),
      systemRequirements: JSON.stringify({
        os: 'Windows 10/11, macOS 10.15+, iOS, Android',
        memory: '2GB RAM minimum',
        storage: '500MB available space',
        processor: 'Any modern processor'
      }),
      fileSize: '150MB',
      version: '5.3',
      categoryName: 'Security',
      stockCount: 1200,
      downloadLimit: 10
    },
    {
      name: 'DataAnalyzer Pro',
      description: 'Powerful data analysis and visualization tool for businesses. Create stunning reports, dashboards, and insights from your data.',
      shortDescription: 'Business data analysis and visualization',
      price: 399.99,
      images: JSON.stringify([
        '/images/dataanalyzer-1.jpg',
        '/images/dataanalyzer-2.jpg',
        '/images/dataanalyzer-3.jpg'
      ]),
      features: JSON.stringify([
        'Advanced data visualization',
        'Interactive dashboards',
        'Statistical analysis tools',
        'Database connectivity',
        'Report generation',
        'Team collaboration'
      ]),
      systemRequirements: JSON.stringify({
        os: 'Windows 10/11, macOS 10.15+',
        memory: '8GB RAM minimum, 16GB recommended',
        storage: '2GB available space',
        processor: 'Intel Core i5 or equivalent'
      }),
      fileSize: '1.8GB',
      version: '4.0',
      categoryName: 'Business',
      isFeatured: true,
      stockCount: 300,
      downloadLimit: 3
    },
    {
      name: 'WebBuilder Studio',
      description: 'Drag-and-drop website builder for creating professional websites without coding. Includes templates, hosting, and SEO tools.',
      shortDescription: 'No-code website builder',
      price: 99.99,
      originalPrice: 149.99,
      images: JSON.stringify([
        '/images/webbuilder-1.jpg',
        '/images/webbuilder-2.jpg'
      ]),
      features: JSON.stringify([
        'Drag-and-drop builder',
        'Professional templates',
        'SEO optimization tools',
        'Mobile responsive design',
        'E-commerce integration',
        'Analytics dashboard'
      ]),
      systemRequirements: JSON.stringify({
        os: 'Windows 10/11, macOS 10.15+',
        memory: '4GB RAM minimum',
        storage: '1GB available space',
        processor: 'Intel Core i3 or equivalent'
      }),
      fileSize: '800MB',
      version: '2.5',
      categoryName: 'Development Tools',
      stockCount: 600,
      downloadLimit: 5
    }
  ];

  for (const productData of products) {
    // Check if product exists by name
    const existingProduct = await prisma.product.findFirst({
      where: { name: productData.name }
    });

    if (existingProduct) {
      // Update existing product
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData
      });
    } else {
      // Create new product
      await prisma.product.create({
        data: productData
      });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
