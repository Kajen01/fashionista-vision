import React from 'react';
import { Upload } from 'lucide-react';

const ModelSelector = ({
  selectedModel,
  onModelSelect,
  onPhotoUpload,
  uploadedPhoto,
}) => {
  const models = [
    {
      id: 'model1',
      name: 'Model A - Slim',
      height: '5\'2" - 5\'4"',
      image: 'https://kimi-web-img.moonshot.cn/img/www.fashiongonerogue.com/6280f1fa7e47b759494fcc5242218684a2185e48.jpg',
    },
    {
      id: 'model2',
      name: 'Model B - Average',
      height: '5\'5" - 5\'7"',
      image: 'https://kimi-web-img.moonshot.cn/img/cdn.cliqueinc.com/69c63837de5e945115bf7d4f4b12318e667a229b.jpg',
    },
    {
      id: 'model3',
      name: 'Model C - Tall',
      height: '5\'8" - 6\'0"',
      image: 'https://kimi-web-img.moonshot.cn/img/thewowstyle.com/41fe89edc0b30e3fa37ae7767cae61827d476cb3.jpg',
    },
  ];

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Choose Your Model
        </h3>

        <div className="space-y-4 mb-6">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedModel === model.id
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-gray-200 hover:border-rose-300'
                }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={model.image}
                  alt={model.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {model.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {model.height}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">
            Or Upload Your Photo
          </h4>

          <input
            type="file"
            id="photoUpload"
            accept="image/*"
            onChange={onPhotoUpload}
            className="hidden"
          />

          <div
            onClick={() =>
              document.getElementById('photoUpload')?.click()
            }
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-rose-300 transition-colors"
          >
            {uploadedPhoto ? (
              <img
                src={uploadedPhoto}
                alt="Uploaded"
                className="w-full h-40 object-cover rounded-lg"
              />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Upload Photo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG supported
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;