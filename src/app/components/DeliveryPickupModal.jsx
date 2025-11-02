"use client";
import { useEffect, useState } from "react";
import { useOrderTypeStore } from "../../store/orderTypeStore";
import { useDeliveryAreaStore } from "../../store/deliveryAreaStore";
import { useBranchStore } from "../../store/branchStore";
import { Truck, ShoppingBag, MapPin } from "lucide-react";

export default function DeliveryPickupModal() {
  const [isSiteActive, setIsSiteActive] = useState(true);
  const [settings, setSettings] = useState({
    allowDelivery: true,
    allowPickup: true,
    defaultOption: 'none',
  });

  const { orderType, setOrderType } = useOrderTypeStore();
  const { deliveryArea, setDeliveryArea } = useDeliveryAreaStore();
  const { branch, setBranch } = useBranchStore();

  const [branches, setBranches] = useState([]);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState("/logo.png"); 

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [statusRes, settingsRes, logoRes, branchesRes] = await Promise.all([
          fetch("/api/site-status"),
          fetch("/api/delivery-pickup"),
          fetch("/api/logo"),
          fetch("/api/branches")
        ]);

        if (statusRes.ok) setIsSiteActive((await statusRes.json()).isSiteActive);
        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (logoRes.ok) setLogoUrl((await logoRes.json()).logo);
        if (branchesRes.ok) {
          const branchData = await branchesRes.json();
          setBranches(branchData);
          // Set first branch as default if no branch is selected
          if (!branch && branchData && branchData.length > 0) {
            setBranch(branchData[0]);
          }
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setIsSiteActive(false); 
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch delivery areas when branch changes
  useEffect(() => {
    async function fetchDeliveryAreas() {
      if (!branch || orderType !== 'delivery') {
        setDeliveryAreas([]);
        return;
      }

      try {
        const res = await fetch(`/api/delivery-areas?branchId=${branch._id}`);
        if (res.ok) {
          const data = await res.json();
          setDeliveryAreas(data.filter(area => area.isActive));
        } else {
          console.error("Failed to fetch delivery areas");
          setDeliveryAreas([]);
        }
      } catch (error) {
        console.error("Error fetching delivery areas:", error);
        setDeliveryAreas([]);
      }
    }
    
    fetchDeliveryAreas();
  }, [branch, orderType]);

  useEffect(() => {
    if (!orderType && settings.defaultOption !== 'none') {
      if ((settings.defaultOption === 'delivery' && settings.allowDelivery) || 
          (settings.defaultOption === 'pickup' && settings.allowPickup)) {
        setOrderType(settings.defaultOption);
      }
    }
  }, [orderType, settings, setOrderType]);

  useEffect(() => {
    const isReadyToClose = branch && orderType && 
                           (orderType === 'pickup' || (orderType === 'delivery' && deliveryArea));
    setOpen(!isReadyToClose);
  }, [branch, orderType, deliveryArea]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOrderTypeSelect = (type) => {
    if (orderType === type) return;
    setOrderType(type);
    setDeliveryArea(null); 
  };
  
  const handleBranchSelect = (e) => {
    const selectedBranchId = e.target.value;
    const selectedBranch = branches.find(b => b._id === selectedBranchId);
    setBranch(selectedBranch || null);
    setDeliveryArea(null); // Reset delivery area when branch changes
  };
  
  const handleDeliveryAreaSelect = (e) => {
    const selectedAreaId = e.target.value;
    const area = deliveryAreas.find(a => a._id === selectedAreaId);
    setDeliveryArea(area || null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="relative">
          <div className="bg-red-600 h-16"></div>
          <div className="absolute left-1/2 -translate-x-1/2 top-4 flex justify-center">
            <div className="rounded-full bg-white p-1 border-2 border-gray-200 shadow-md">
              <img 
                src={logoUrl} 
                alt="Restaurant Logo" 
                className="h-24 w-24 object-contain rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-16 space-y-6">
          {/* Branch Selection */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2 text-red-600" size={20} />
              Select Branch
            </h3>
            <select
              value={branch?._id || ""}
              onChange={handleBranchSelect}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-black"
            >
              <option value="" disabled className="text-gray-500">
                Please select a branch
              </option>
              {branches.map((b) => (
                <option key={b._id} value={b._id} className="text-black">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Type Selection */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Order Type</h3>
            <div className={`grid ${settings.allowDelivery && settings.allowPickup ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {settings.allowDelivery && (
                <button
                  onClick={() => handleOrderTypeSelect("delivery")}
                  disabled={!branch}
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-200 ease-in-out h-24 ${
                    !branch
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                      : orderType === "delivery"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white hover:border-red-400"
                  }`}
                >
                  <Truck size={28} className={!branch ? "text-gray-400" : "text-red-600"} />
                  <span className={`font-semibold text-sm mt-2 ${!branch ? "text-gray-400" : "text-gray-800"}`}>
                    Delivery
                  </span>
                </button>
              )}
              {settings.allowPickup && (
                <button
                  onClick={() => handleOrderTypeSelect("pickup")}
                  disabled={!branch}
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-200 ease-in-out h-24 ${
                    !branch
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                      : orderType === "pickup"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white hover:border-red-400"
                  }`}
                >
                  <ShoppingBag size={28} className={!branch ? "text-gray-400" : "text-red-600"} />
                  <span className={`font-semibold text-sm mt-2 ${!branch ? "text-gray-400" : "text-gray-800"}`}>
                    Pickup
                  </span>
                </button>
              )}
            </div>
            {!branch && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Please select a branch first
              </p>
            )}
          </div>

          {/* Delivery Area Selection */}
          {orderType === 'delivery' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Select Delivery Area</h3>
              <select
                value={deliveryArea?._id || ""}
                onChange={handleDeliveryAreaSelect}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-black"
              >
                <option value="" disabled className="text-gray-500">
                  {branch ? 'Please select your delivery area' : 'Select a branch first'}
                </option>
                {deliveryAreas.length > 0 ? (
                  deliveryAreas.map((area) => (
                    <option 
                      key={area._id} 
                      value={area._id} 
                      className="text-black"
                    >
                      {area.name} (Fee: Rs. {area.fee})
                    </option>
                  ))
                ) : branch ? (
                  <option disabled className="text-gray-500">No delivery areas available for this branch</option>
                ) : null}
              </select>
              {branch && deliveryAreas.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  No delivery areas available for {branch.name}. Please try pickup or contact support.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}