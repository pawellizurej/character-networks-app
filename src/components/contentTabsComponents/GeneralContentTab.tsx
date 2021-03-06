
import Slider from "rc-slider";
import React, { FunctionComponent, useContext, useEffect, useState } from "react";
import 'rc-slider/assets/index.css';
import { GlobalGraphSettingsContext } from "../../contexts/SettingsContext";
import { GraphContext } from "../../contexts/GraphContext";
import { GraphRefresherContext } from "../../contexts/GraphRefresherContext";
import { useParams } from "react-router-dom";
import ControllableList, { ControllableListElement } from "../ControlableList/ControllableList";
import { SelectedNodeContext } from "../../contexts/SelectedNodeContext";
import "./tabStyles.css";


const ListElementRenderer = (props: any) => {
  return (
    <div>
      {props.name}
    </div>
  );
}

interface GeneralContentTabProps {
  /* nodes props etc */
}

const GeneralContentTab: FunctionComponent<GeneralContentTabProps> = () => {
  const selectedNode = useContext(SelectedNodeContext);
  const { settings, updateSettings } = useContext(GlobalGraphSettingsContext);
  const graph = useContext(GraphContext);
  const refresh = useContext(GraphRefresherContext);
  let { id } = useParams();

  const [fetchingSettingsFinished, setFetchingSettingsFinished] = useState<boolean>(false);
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false);

  const [minMaxValuesNodesThreshold, setMinMaxValuesNodesThreshold] = useState({
    min: 1,
    max: 100,
  });
  const [minMaxDefault, setMinMaxDefault] = useState({
    min: 1,
    max: 100,
  });

  const [internalMinMax, setInternalMinMax] = useState({
    min: settings.minCountThreshold,
    max: settings.maxCountThreshold,
  });

  const [hiddenNodes, setHiddenNodes] = useState<number[]>([]);
  useEffect(() => {
    setFetchingSettingsFinished(false);
    fetch(`http://${process.env.REACT_APP_BACKEND_ADDRESS}:${process.env.REACT_APP_BACKEND_PORT}/graph/${id}/settings`, {
      method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      setMinMaxValuesNodesThreshold({
        min: 0,
        max: data.maxThresholdValue,
      });
      setInternalMinMax({
        min: data.thresholdMin,
        max: data.thresholdMax,
      });
      setMinMaxDefault({
        min: data.thresholdMin,
        max: data.thresholdMax,
      });
      setHiddenNodes(data.hiddenNodes.map((n: any) => ({value: n[0], name: n[1]})));
      console.log(data.hiddenNodes.map((n: any) => ({value: n[0], name: n[1]})))
    }).catch(e => {
      setErrorOccurred(true);
    }).finally(() => {
      setFetchingSettingsFinished(true);
    });
  }, []);
/*
  useEffect(() => {
    if (graph !== null && graph.nodes.length > 0) {
      let min = graph.nodes[0].count;
      let max = min;

      min = graph.nodes.reduce((prev, curr) => {
        return prev.count < curr.count ? prev : curr;
      }).count;
      max = graph.nodes.reduce((prev, curr) => {
        return prev.count > curr.count ? prev : curr;
      }).count;

      setMinMaxValuesNodesThreshold({
        min: min,
        max: max,
      });
      setInternalMinMax({
        min: settings.minCountThreshold,
        max: settings.maxCountThreshold,
      });

    } else {
      setMinMaxValuesNodesThreshold({
        min: 0,
        max: 0,
      });
      setInternalMinMax({
        min: 0,
        max: 0,
      });
    }
  }, [graph]);
*/
  const updateSettingsReq = (value: any) => {
    if (Array.isArray(value)) {
      updateSettings({
        minCountThreshold: value[0] < value[1] ? value[0] : value[1],
        maxCountThreshold: value[0] > value[1] ? value[0] : value[1], 
      });
      console.log(JSON.stringify({
        thresholdMin: value[0] < value[1] ? value[0] : value[1],
        thresholdMax: value[0] > value[1] ? value[0] : value[1],
      }))
      fetch('http://localhost:5000/graph/cc5aa68a-cd26-4854-8a92-d7cc56917d5f/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          thresholdMin: value[0] < value[1] ? value[0] : value[1],
          thresholdMax: value[0] > value[1] ? value[0] : value[1],
        })
      })
      .then(response => {
        refresh();
      });
    }
  };

  let marks: any = {}
  marks[minMaxValuesNodesThreshold.min] = minMaxValuesNodesThreshold.min;
  marks[minMaxValuesNodesThreshold.max] = minMaxValuesNodesThreshold.max;

  return (
    <div className="flex flex-col grow basis-0">
      { !errorOccurred && fetchingSettingsFinished &&
        <>
          <div className="text-base">
            <div className="text-lg semi-bold">
              Nodes count thresholds:
            </div>
            <div className="p-2">
              <Slider
                range
                defaultValue={[minMaxDefault.min, minMaxDefault.max]}
                min={minMaxValuesNodesThreshold.min}
                max={minMaxValuesNodesThreshold.max}
                marks={marks}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    setInternalMinMax({
                      min: value[0] < value[1] ? value[0] : value[1],
                      max: value[0] > value[1] ? value[0] : value[1], 
                    });
                  }
                }}
                onAfterChange={updateSettingsReq}
              />
            </div>
            <div className="mt-4 flex justify-evenly">
              <div>
                min: {internalMinMax.min}
              </div>
              <div>
                max: {internalMinMax.max}
              </div>
            </div>
          </div>
          <div className="flex flex-col grow basis-0">
            <div className="label">
              Hidden nodes({hiddenNodes.length}): 
            </div>
            <div className="flex flex-col grow basis-0">
              <ControllableList 
                className="flex flex-col grow basis-0"
                listArray={hiddenNodes} 
                elementRenderer={(elProp) =>{
                  return (<>
                    <ControllableListElement onClick={() => {
                      selectedNode.updateNodeId({value: elProp.value});
                    }}>
                      <div className="flex items-center justify-items-center h-full pl-2">
                        <span>
                          {elProp.name}
                        </span>
                      </div>
                    </ControllableListElement>
                  </>)
                }
              }/>
            </div>
          </div>
        </>
      }
    </div>
  );
}

export default GeneralContentTab;

