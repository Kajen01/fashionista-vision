import React from 'react';
import GarmentPicker from './GarmentPicker';
import MirrorControls from './MirrorControls';

const MirrorSidebar = ({
  garments,
  garmentsLoading,
  garmentsError,
  selectedGarment,
  onSelectGarment,
  onUploadGarment,
  uploadingGarment,
  onDeleteGarment,
  deletingGarmentId,
  toggles,
  setToggles,
  params,
  setParams,
  onReset,
}) => {
  return (
    <aside className="lg:sticky lg:top-24">
      <div className="space-y-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
        <MirrorControls
          toggles={toggles}
          setToggles={setToggles}
          params={params}
          setParams={setParams}
          onReset={onReset}
        />

        <GarmentPicker
          garments={garments}
          garmentsLoading={garmentsLoading}
          garmentsError={garmentsError}
          selectedGarment={selectedGarment}
          onSelectGarment={onSelectGarment}
          onUploadGarment={onUploadGarment}
          uploadingGarment={uploadingGarment}
          onDeleteGarment={onDeleteGarment}
          deletingGarmentId={deletingGarmentId}
        />
      </div>
    </aside>
  );
};

export default MirrorSidebar;
