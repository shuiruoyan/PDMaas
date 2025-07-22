import {fixFiled} from 'dataSource_utils';
import {ACTION} from '../../lib/constant';

const CORE = ACTION.CORE;

// 核心的项目更新
const core = (state = {}, action) => {
  switch (action.type) {
    case CORE.GET_PROJECT_SUCCESS:
      return {
          ...state,
          data: action.data,
      };
    case CORE.UPDATE_PROJECT_STATUS_SUCCESS:
      return {
        ...state,
        data: action.data,
      };
    case CORE.UPDATE_PROFILE_USER_SUCCESS:
      return {
        ...state,
        data: {
          ...state.data,
          profile: {
            ...(state?.data?.profile || {}),
            user: action?.data,
          },
        },
      };
    case CORE.UPDATE_PROJECT_PROFILE:
      return {
        ...state,
        data: {
          ...state.data,
          profile: {
            // todo
            ...(state?.data?.profile || {}),
            ...(action?.data?.profile || {}),
          },
        },
      };
    case CORE.EXEC_COMMAND_SUCCESS:
      return {
        ...state,
        data: action.data,
      };
    case CORE.CLEAR: return {};
    case CORE.FIX_PROFILE: return {
      ...state,
      data: {
        ...state.data,
        profile: {
          ...state.data.profile,
          global: {...action.data.global},
          team: {
            ...state.data.profile.team,
            bizDomainTypes: [...(action.data.team.bizDomainTypes || [])],
          },
        },
        project: {
          ...state.data.project,
          entities: (state.data.project.entities || []).map((entity) => {
            return {
              ...entity,
              fields: (entity.fields || []).map(field => ({
                ...field,
                ...fixFiled(field, {
                  ...state.data.profile,
                  global: {...action.data.global},
                  team: {
                    ...state.data.profile.team,
                    bizDomainTypes: [...(action.data.team.bizDomainTypes || [])],
                  },
                }),
              })),
            };
          }),
        },
      },
    };
    default:
      return state;
  }
};

export default core;
