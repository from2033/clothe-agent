import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera, Save, User, Check } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  photo: string;
  name: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  weight: string;
}

export function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    photo: "",
    name: "",
    height: "",
    bust: "",
    waist: "",
    hips: "",
    weight: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    toast.success("保存成功", {
      icon: <Check className="w-4 h-4" />,
    });
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="pb-4">
      {/* Photo Upload */}
      <div className="bg-white px-4 pt-6 pb-6 mb-2">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24 border-4 border-gray-100">
              <AvatarImage src={profile.photo} alt="个人照片" />
              <AvatarFallback className="bg-gray-50">
                <User className="w-12 h-12 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              id="photo-upload"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            <label htmlFor="photo-upload">
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#07C160] rounded-full flex items-center justify-center cursor-pointer active:bg-[#06AD56] transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-500 text-center leading-relaxed px-4">
            建议拍摄正面全身照<br/>光线充足 · 背景简洁
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white px-4 pt-4 pb-5 mb-2">
        <h3 className="text-[15px] font-medium mb-4">基本信息</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-gray-700">姓名</Label>
            <Input
              id="name"
              placeholder="请输入您的姓名"
              value={profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm text-gray-700">身高 (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={profile.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm text-gray-700">体重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="55"
                value={profile.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Three measurements */}
      <div className="bg-white px-4 pt-4 pb-5 mb-2">
        <h3 className="text-[15px] font-medium mb-4">三围数据</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bust" className="text-sm text-gray-700">胸围 (cm)</Label>
            <Input
              id="bust"
              type="number"
              placeholder="85"
              value={profile.bust}
              onChange={(e) => handleChange("bust", e.target.value)}
              className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waist" className="text-sm text-gray-700">腰围 (cm)</Label>
            <Input
              id="waist"
              type="number"
              placeholder="65"
              value={profile.waist}
              onChange={(e) => handleChange("waist", e.target.value)}
              className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hips" className="text-sm text-gray-700">臀围 (cm)</Label>
            <Input
              id="hips"
              type="number"
              placeholder="90"
              value={profile.hips}
              onChange={(e) => handleChange("hips", e.target.value)}
              className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
            />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-900 mb-2">测量小贴士</h4>
          <ul className="text-xs text-blue-800 space-y-1.5 leading-relaxed">
            <li>• 胸围：从腋下沿胸部最丰满处水平测量</li>
            <li>• 腰围：沿腰部最细处水平测量一周</li>
            <li>• 臀围：沿臀部最丰满处水平测量</li>
          </ul>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-4">
        <Button 
          onClick={handleSave} 
          className="w-full gap-2 h-11 bg-[#07C160] hover:bg-[#06AD56]" 
          size="lg"
        >
          <Save className="w-4 h-4" />
          保存信息
        </Button>
      </div>
    </div>
  );
}