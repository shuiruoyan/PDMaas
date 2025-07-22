import defaultProfile from './default_profile.json';
import {decrypt, encrypt, decryptEE} from "./crypto";
import _ from "lodash";

const adjustKey = (preDataArray, data, key = 'defKey',  connector = '_') => {
    let finalKey = data[key]
    const regex = new RegExp(`${connector}(\\d+)$`);
    while ((preDataArray || []).find(it => it[key] === finalKey)) {
        if(!finalKey) {
            break;
        }
        if (finalKey.match(regex)) {
            const suffix = finalKey.slice(finalKey.lastIndexOf(connector) + connector.length);
            const num = _.parseInt(suffix) + 1;
            finalKey = finalKey.slice(0, finalKey.lastIndexOf(connector) + connector.length) + num;
        } else {
            finalKey = `${finalKey}${connector}1`
        }
    }
    return {
        ...data,
        [key]: finalKey
    }

}

export const getId = () => {
    return Math.uuid();
}

export const updateDbEnvironment = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || [])
                        .map((it) => {
                            if (it.id === data.id) {
                                return {
                                    ...it,
                                    ...data,
                                };
                            }
                            return it;
                        }),
                ],
            }
        }
    }
}

export const createDbEnvironment = (getCurrentUserConfig, data) => {
    const id = getId();
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []),
                    {
                        ...data,
                        id,
                        dbConnections: data.dbConnections.map(c => {
                            return {
                                ...c,
                                envId: id,
                            }
                        })
                    },
                ],
            },
        },
    }
}

export const deleteDbEnvironment = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || [])
                        .filter(it => it.id !== data),
                ],
            },

        },
    }
}

export const copyDbEnvironment = (getCurrentUserConfig, data) => {
    const currentData = (getCurrentUserConfig().profile.team.dbEnvironments || [])
        .find(it => it.id === data);
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []),
                    {
                        ...adjustKey(getCurrentUserConfig().profile.team.dbEnvironments || [], currentData || {}),
                        dbConnections: (currentData.dbConnections || []).map(it => ({...it, id: getId()})),
                        excludeTables: (currentData.excludeTables || []).map(it => ({...it, id: getId()})),
                        id: getId()
                    },
                ],
            }
        },
    }
}

export const dragDbEnvironment = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [...(data || [])],
            }
        },
    }
}

export const dbConnectDelete = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []).map((it) => {
                        return {
                            ...it,
                            dbConnections: [
                                ...(it.dbConnections || [])
                                    .filter(dbConnection => dbConnection.id !== data),
                            ],
                        };
                    }),
                ],
            }
        },
    }
}

export const dbConnectUpdate = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []).map((it) => {
                        return {
                            ...it,
                            dbConnections: [
                                ...(it.dbConnections || []).map((dbConnection) => {
                                    if(dbConnection.id === data.id) {
                                        return {
                                            ...dbConnection,
                                            ...data,
                                        };
                                    }
                                    return dbConnection;
                                }),
                            ],
                        };
                    })
                ],
            }
        },
    }
}

export const dbConnectCreate = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []).map((it) => {
                        if(it.id === data.envId) {
                            return {
                                ...it,
                                dbConnections: [
                                    ...(it.dbConnections || []),
                                    {
                                        ...data.requestObj,
                                    },

                                ],
                            };
                        }
                        return it;
                    }),
                ],
            }
        },
    }
}

export const dbEnvironmentExcludeTableUpdate = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []).map((it) => {
                        if(it.id === data.envId) {
                            return {
                                ...it,
                                excludeTables: [
                                    ...(it.excludeTables || []).map((excludeTable) => {
                                        if(data.id === excludeTable.id) {
                                            return {
                                                ...excludeTable,
                                                ...data,
                                            };
                                        }
                                        return excludeTable;
                                    }),
                                ],
                            };
                        }
                        return it;
                    }),
                ],
            }
        },
    }
}

export const dbEnvironmentExcludeTableCreate = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []).map((it) => {
                        if(it.id === data.envId) {
                            return {
                                ...it,
                                excludeTables: [
                                    ...(it.excludeTables || []),
                                    {
                                        ...data.tableObj,
                                        id: getId()
                                    },
                                ],
                            };
                        }
                        return it;
                    }),
                ],
            }
        },
    }
}

export const dbEnvironmentExcludeTableDelete = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: [
                    ...(getCurrentUserConfig().profile.team.dbEnvironments || []).map((it) => {
                        return {
                            ...it,
                            excludeTables: [
                                ...(it.excludeTables || [])
                                    .filter(excludeTable => excludeTable.id !== data),
                            ],
                        };
                    }),
                ],
            }
        },
    }
}

export const createDomain = (getCurrentUserConfig, data) => {
    const currentBizDomainTypes = getCurrentUserConfig().profile.team.bizDomainTypes || [];
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: [
                    ...currentBizDomainTypes,
                    {
                        ...data,
                        orderValue: currentBizDomainTypes.length,
                        id: getId()
                    }
                ]
            }
        },
    }
}

export const updateDomain = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: [
                    ...(getCurrentUserConfig().profile.team.bizDomainTypes || [])
                        .map(it => {
                            if(it.id === data.id) {
                                return {
                                    ...it,
                                    ...data
                                }
                            }
                            return it;
                        }),
                ]
            }
        },
    }
}

export const copyDomain = (getCurrentUserConfig, data) => {
    const currentBizDomainTypes = getCurrentUserConfig().profile.team.bizDomainTypes || [];
    const index = data.orderValue;
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: [
                    ...currentBizDomainTypes.map(it => {
                        if(it.orderValue > index) {
                            return {
                                ...it,
                                orderValue: it.orderValue + 1
                            }
                        }
                        return it;
                    }),
                    {
                        ...adjustKey(currentBizDomainTypes, data || {}),
                        orderValue: index + 1,
                        id: getId()
                    }
                ].sort((x, y) => x.orderValue - y.orderValue)
            }
        },
    }
}

export const deleteDomain = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: [
                    ...(getCurrentUserConfig().profile.team.bizDomainTypes || [])
                        .filter(it => it.id !== data.id)
                        .map((it, index) => ({...it, orderValue: index})),
                ]
            }
        },
    }
}

export const dragDomain = (getCurrentUserConfig, data) => {
    const currentBizDomainTypes = getCurrentUserConfig().profile.team.bizDomainTypes || [];
    const index = currentBizDomainTypes.findIndex(item => item.id === data.id);

    if(index === -1) return {...getCurrentUserConfig()}

    const targetIndex = index - data.step;

    if (targetIndex < 0 || targetIndex >= currentBizDomainTypes.length) return {...getCurrentUserConfig()};

    [currentBizDomainTypes[index], currentBizDomainTypes[targetIndex]] = [currentBizDomainTypes[targetIndex], currentBizDomainTypes[index]];

    [currentBizDomainTypes[index].orderValue, currentBizDomainTypes[targetIndex].orderValue] = [currentBizDomainTypes[targetIndex].orderValue, currentBizDomainTypes[index].orderValue];

    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: [
                    ...(currentBizDomainTypes || [])
                ]
            }
        },
    }
}

export const batchAddDomain = (getCurrentUserConfig, data) => {
    const currentBizDomainTypes = getCurrentUserConfig().profile.team.bizDomainTypes || [];
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: [
                    ...currentBizDomainTypes,
                    ...data.map((it, i) => ({...it,
                        orderValue: currentBizDomainTypes.length + i,
                        id: getId()
                    }))
                ]
            }
        },
    }
}

export const createBaseDataType = (getCurrentUserConfig, data) => {
    const currentDataTypes = getCurrentUserConfig().profile.global.dataTypes;
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dataTypes: [
                    ...(currentDataTypes || []),
                    {
                        ...data,
                        orderValue: currentDataTypes.length + 1,
                        id: getId()
                    }
                ]
            }
        },
    }
}

export const deleteBaseDataType = (getCurrentUserConfig, data) => {
    const currentDataTypes = getCurrentUserConfig().profile.global.dataTypes;
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dataTypes: [
                    ...(currentDataTypes || []).filter(it => it.id !== data.id)
                        .map((it, index) => ({
                            ...it,
                            orderValue: index
                        })),
                ]
            }
        },
    }
}

export const updateBaseDataType = (getCurrentUserConfig, data) => {
    const currentDataTypes = getCurrentUserConfig().profile.global.dataTypes;
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dataTypes: [
                    ...(currentDataTypes || []).map((it) => {
                        if(it.id === data.dataType.id) {
                            return {
                                ...it,
                                ...(data.dataType || {}),
                            }
                        }
                        return it;
                    }),
                ]
            }
        },
    }
}

export const dragBaseDataType = (getCurrentUserConfig, data) => {
    const currentDataTypes = getCurrentUserConfig().profile.global.dataTypes.map((it, index) => ({...it, orderValue: index}));
    const index = currentDataTypes.findIndex(item => item.id === data.dateTypeId);

    if(index === -1) return {...getCurrentUserConfig()}

    const targetIndex = index - data.step;

    if (targetIndex < 0 || targetIndex >= currentDataTypes.length) return {...getCurrentUserConfig()};

    [currentDataTypes[index], currentDataTypes[targetIndex]] = [currentDataTypes[targetIndex], currentDataTypes[index]];

    [currentDataTypes[index].orderValue, currentDataTypes[targetIndex].orderValue] = [currentDataTypes[targetIndex].orderValue, currentDataTypes[index].orderValue];

    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dataTypes: [
                    ...(currentDataTypes || []).sort((x, y) => x.orderValue - y.orderValue)
                ]
            }
        },
    }
}

export const createDb = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dbDialects: [
                    ...(getCurrentUserConfig().profile.global.dbDialects || []),
                    {
                        ..._.omit(data.dbDialect, ['dataType','dataTypes']),
                        id: getId()
                    }
                ].map((it, index) => ({...it, orderValue: index})),
                dataTypes: [
                    ...(getCurrentUserConfig().profile.global.dataTypes || []).map(it => {
                        const currentDataTypes = (data.dataTypes || []).find(d => d.id === it.id)?.dbDataType || {};
                        return {
                            ...it,
                            dbDataType: {
                                ...(it.dbDataType || {}),
                                ..._.pick(currentDataTypes, data.dbDialect.defKey)
                            }
                        }
                    }),
                ]
            }
        }
    }
}

export const updateDb = (getCurrentUserConfig, data) => {
    const {dbDialect, dataTypes} = data;
    const pre = (getCurrentUserConfig().profile.global.dbDialects || []).find(it => it.id === dbDialect.id) || {}
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dbDialects: [
                    ...(getCurrentUserConfig().profile.global.dbDialects || []).map(it => {
                        if(it.id === dbDialect.id) {
                            return {
                                ...it,
                                ..._.omit(data.dbDialect, ['dataType','dataTypes']),
                            }
                        }
                        return it;
                    })
                ],
                dataTypes: [
                    ...(getCurrentUserConfig().profile.global.dataTypes || []).map(it => {
                        const currentDataTypes = (dataTypes || []).find(d => d.id === it.id)?.dbDataType || {};
                        return {
                            ...it,
                            dbDataType: {
                                ..._.omit((it.dbDataType || {}), pre.defKey),
                                ..._.pick(currentDataTypes, data.dbDialect.defKey)
                            }
                        }
                    }),
                ]
            }
        }
    }
}

export const changeDbEnable = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dbDialects: [
                    ...(getCurrentUserConfig().profile.global.dbDialects || []).map(it => {
                        if(it.id === data.id) {
                            return {
                                ...it,
                                ..._.pick(data, 'isEnabled')
                            }
                        }
                        return it;
                    })
                ],
            }
        }
    }
}


export const deleteDb = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dbDialects: [
                    ...(getCurrentUserConfig().profile.global.dbDialects || [])
                        .filter(it => it.id !== data.id)
                        .map((it, index) => ({...it, orderValue: index})),
                ],
                dataTypes: [
                    ...(getCurrentUserConfig().profile.global.dataTypes || [])
                        .map(it => {
                            return {
                                ...it,
                                dbDataType: {..._.omit(it.dbDataType, data.defKey)}
                            }
                        })
                ]
            }
        }
    }
}

export const dragDb = (getCurrentUserConfig, data) => {
    const currentDBDialects = getCurrentUserConfig().profile.global.dbDialects.map((it, index) => ({...it, orderValue: index}));
    const index = currentDBDialects.findIndex(item => item.id === data.id);

    if(index === -1) return {...getCurrentUserConfig()}

    const targetIndex = index + data.step;

    if (targetIndex < 0 || targetIndex >= currentDBDialects.length) return {...getCurrentUserConfig()};

    [currentDBDialects[index], currentDBDialects[targetIndex]] = [currentDBDialects[targetIndex], currentDBDialects[index]];

    [currentDBDialects[index].orderValue, currentDBDialects[targetIndex].orderValue] = [currentDBDialects[targetIndex].orderValue, currentDBDialects[index].orderValue];

    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                dbDialects: [
                    ...(currentDBDialects || []).sort((x, y) => x.orderValue - y.orderValue)
                ]
            }
        },
    }
}

export const createProgram = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                programLangs: [
                    ...(getCurrentUserConfig().profile.global.programLangs || []),
                    {
                        ..._.omit(data.programLang, ['dataType','dataTypes']),
                        id: getId()
                    }
                ].map((it, index) => ({...it, orderValue: index})),
                dataTypes: [
                    ...(getCurrentUserConfig().profile.global.dataTypes || []).map(it => {
                        const currentLangDataType = (data.dataTypes || []).find(d => d.id === it.id)?.langDataType || {};
                        return {
                            ...it,
                            langDataType: {
                                ...(it.langDataType || {}),
                                ..._.pick(currentLangDataType, data.programLang.defKey)
                            }
                        }
                    }),
                ]
            }
        }
    }
}

export const updateProgram = (getCurrentUserConfig, data) => {
    const {programLang, dataTypes} = data;
    const pre = (getCurrentUserConfig().profile.global.programLangs || []).find(it => it.id === programLang.id)
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                programLangs: [
                    ...(getCurrentUserConfig().profile.global.programLangs || []).map(it => {
                        if(it.id === programLang.id) {
                            return {
                                ...it,
                                ..._.omit(data.programLang, ['dataType','dataTypes']),
                            }
                        }
                        return it;
                    })
                ],
                dataTypes: [
                    ...(getCurrentUserConfig().profile.global.dataTypes || []).map(it => {
                        const currentLangDataType = (dataTypes || []).find(d => d.id === it.id)?.langDataType || {};
                        return {
                            ...it,
                            langDataType: {
                                ..._.omit((it.langDataType || {}), pre.defKey),
                                ..._.pick(currentLangDataType, data.programLang.defKey)
                            }
                        }
                    }),
                ]
            }
        }
    }
}


export const changeProgramEnable = (getCurrentUserConfig, data) =>      {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                programLangs: [
                    ...(getCurrentUserConfig().profile.global.programLangs || []).map(it => {
                        if(it.id === data.id) {
                            return {
                                ...it,
                                ..._.pick(data, 'isEnabled')
                            }
                        }
                        return it;
                    })
                ],
            }
        }
    }
}

export const toDragProgramLang = (getCurrentUserConfig, data) => {
    const currentProgramLangs = getCurrentUserConfig().profile.global.programLangs.map((it, index) => ({...it, orderValue: index}));
    const index = currentProgramLangs.findIndex(item => item.id === data.id);

    if(index === -1) return {...getCurrentUserConfig()}

    const targetIndex = index + data.step;

    if (targetIndex < 0 || targetIndex >= currentProgramLangs.length) return {...getCurrentUserConfig()};

    [currentProgramLangs[index], currentProgramLangs[targetIndex]] = [currentProgramLangs[targetIndex], currentProgramLangs[index]];

    [currentProgramLangs[index].orderValue, currentProgramLangs[targetIndex].orderValue] = [currentProgramLangs[targetIndex].orderValue, currentProgramLangs[index].orderValue];

    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                programLangs: [
                    ...(currentProgramLangs || []).sort((x, y) => x.orderValue - y.orderValue)
                ]
            }
        },
    }
}

export const deleteProgram = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                programLangs: [
                    ...(getCurrentUserConfig().profile.global.programLangs || [])
                        .filter(it => it.id !== data.id)
                        .map((it, index) => ({...it, orderValue: index})),
                ],
                dataTypes: [
                    ...(getCurrentUserConfig().profile.global.dataTypes || [])
                        .map(it => {
                            return {
                                ...it,
                                langDataType: {..._.omit(it.langDataType, data.defKey)}
                            }
                        })
                ]
            }
        }
    }
}


export const restoreDefaultType = (getCurrentUserConfig) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: defaultProfile.team.bizDomainTypes || []
            },
            global: {
                ...getCurrentUserConfig().profile.global,
                ...defaultProfile.global
            }
        }
    }
}

export const loadTypeFromFile = (getCurrentUserConfig, data) => {
    const profile = data?.profile
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                bizDomainTypes: profile?.team?.bizDomainTypes || []
            },
            global: {
                ...getCurrentUserConfig().profile.global,
                dbDialects: profile?.global?.dbDialects,
                programLangs: profile?.global?.programLangs,
                dataTypes: profile?.global?.dataTypes,
                opceTemplets: profile?.global?.opceTemplets,
            }
        }
    }
}

export const loadConnectorFromFile = (getCurrentUserConfig, data) => {
    const profile = data?.profile;
    const decryptValue = (v) => {
      if(v) {
          if(decrypt(v)) {
              // 高版本EE导出的
              return v;
          } else if(decryptEE(v)) {
              // 低版本ee导出的
              return encrypt(decryptEE(v))
          }
          // 未加密导出的
          return encrypt(v)
      }
      return v
    }
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            team: {
                ...getCurrentUserConfig().profile.team,
                dbEnvironments: (profile?.team?.dbEnvironments || []).map((e) => {
                    const id = getId()
                    return {
                        ...e,
                        id,
                        dbConnections: (e.dbConnections || []).map((c) => {
                            return {
                                ...c,
                                envId: id,
                                url: decryptValue(c.url),
                                password: decryptValue(c.password),
                                username: decryptValue(c.username),
                            };
                        }),
                        excludeTables: (e.excludeTables || []).map((c) => {
                            return {
                                ...c,
                                envId: id,
                            };
                        })
                    };
                })
            },
        }
    }
}

export const updateOpce = (getCurrentUserConfig, data) => {
    return {
        ...getCurrentUserConfig(),
        profile: {
            ...getCurrentUserConfig().profile,
            global: {
                ...getCurrentUserConfig().profile.global,
                opceTemplets: getCurrentUserConfig().profile.global.opceTemplets.map((d) => {
                    if(d.opceKey === data.opceKey) {
                        return data;
                    }
                    return d;
                }),
            },
        }
    }
}
